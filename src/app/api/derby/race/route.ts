/**
 * POST /api/derby/race — deal a fresh standalone race on demand.
 * POST (not GET) so crawlers and link prefetchers never trigger a paid
 * generation. Guards, in order: same-origin -> per-IP rate limit ->
 * global daily budget -> generate. Every refusal returns 503 so the
 * client falls back to local races; players never see an error.
 */
import { NextResponse } from "next/server";
import { generateStandaloneRace } from "@/server/derby";
import {
  budgetAllow,
  clientKey,
  rateLimitAllow,
  sameOrigin,
} from "@/server/rateLimit";

const LIMIT_PER_HOUR = 20; // each race = 2 Haiku calls
const DERBY_BUDGET_PER_DAY = 150; // ~$0.6/day at saturation
const NO_STORE = { headers: { "cache-control": "no-store" } };

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (
    !(await rateLimitAllow(`derby:${clientKey(request)}`, LIMIT_PER_HOUR, 3600))
  ) {
    return NextResponse.json(
      { error: "rate-limited" },
      { status: 429, ...NO_STORE },
    );
  }
  if (!(await budgetAllow("derby", DERBY_BUDGET_PER_DAY))) {
    return NextResponse.json({ error: "budget" }, { status: 503, ...NO_STORE });
  }
  try {
    const race = await generateStandaloneRace();
    return NextResponse.json({ race }, NO_STORE);
  } catch {
    return NextResponse.json(
      { error: "generation-failed" },
      { status: 503, ...NO_STORE },
    );
  }
}
