/**
 * POST /api/pond/catch — generate a fish identity for a catch.
 * Inputs are strictly enums/numbers (no user text -> no injection
 * surface). Falls back cleanly: any failure returns { fallback: true }
 * and the client uses its offline name generator.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { aiAvailable } from "@/server/anthropic";
import { generateFishIdentity, POND_BAITS, POND_SPOTS } from "@/server/pond";
import { clientKey, rateLimitAllow } from "@/server/rateLimit";

const BodySchema = z.object({
  rarity: z.enum(["common", "uncommon", "rare", "legendary", "anomaly"]),
  spot: z.enum(POND_SPOTS),
  sizeCm: z.number().int().min(1).max(999),
  variant: z.enum(["normal", "golden"]),
  bait: z.enum(POND_BAITS).default("bare"),
});

const LIMIT_PER_HOUR = 60;
const HOUR_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  // Order matters: reject malformed requests first, count every valid
  // attempt against the rate limit (even in fallback mode, so behavior
  // is consistent and testable), and only then touch the paid API.
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

  if (!rateLimitAllow(`pond:${clientKey(request)}`, LIMIT_PER_HOUR, HOUR_MS)) {
    return NextResponse.json(
      { fallback: true, reason: "rate-limited" },
      { status: 429 },
    );
  }

  if (!aiAvailable()) {
    return NextResponse.json({ fallback: true, reason: "ai-unavailable" });
  }

  try {
    const identity = await generateFishIdentity(parsed.data);
    return NextResponse.json(identity);
  } catch {
    return NextResponse.json({ fallback: true, reason: "generation-failed" });
  }
}
