/**
 * POST /api/pond/catch — generate a fish identity for a catch.
 * Inputs are strictly enums/numbers (no user text -> no injection
 * surface). Guards: validate -> same-origin -> per-IP rate limit ->
 * global daily budget -> AI availability -> generate. Any refusal
 * returns { fallback: true } and the client uses its offline names.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { aiAvailable } from "@/server/anthropic";
import { generateFishIdentity, POND_BAITS, POND_SPOTS } from "@/server/pond";
import {
  budgetAllow,
  clientKey,
  rateLimitAllow,
  sameOrigin,
} from "@/server/rateLimit";

const BodySchema = z.object({
  rarity: z.enum(["common", "uncommon", "rare", "legendary", "anomaly"]),
  spot: z.enum(POND_SPOTS),
  sizeCm: z.number().int().min(1).max(999),
  variant: z.enum(["normal", "golden"]),
  bait: z.enum(POND_BAITS).default("bare"),
});

const LIMIT_PER_HOUR = 60;
const POND_BUDGET_PER_DAY = 1200; // ~$1/day at saturation (cache reuse lowers it)
const NO_STORE = { headers: { "cache-control": "no-store" } };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (
    !(await rateLimitAllow(`pond:${clientKey(request)}`, LIMIT_PER_HOUR, 3600))
  ) {
    return NextResponse.json(
      { fallback: true, reason: "rate-limited" },
      { status: 429, ...NO_STORE },
    );
  }
  if (!aiAvailable() || !(await budgetAllow("pond", POND_BUDGET_PER_DAY))) {
    return NextResponse.json(
      { fallback: true, reason: "ai-unavailable" },
      NO_STORE,
    );
  }
  try {
    const identity = await generateFishIdentity(parsed.data);
    return NextResponse.json(identity, NO_STORE);
  } catch {
    return NextResponse.json(
      { fallback: true, reason: "generation-failed" },
      NO_STORE,
    );
  }
}
