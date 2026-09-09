/**
 * GET /api/pond/weather — today's shared pond weather.
 * One generation per UTC day serves every visitor (durable cache), so
 * the budget guard here is about the single daily generation, not
 * per-request cost.
 */
import { NextResponse } from "next/server";
import { getDailyWeather } from "@/server/pond";
import { clientKey, rateLimitAllow } from "@/server/rateLimit";

const LIMIT_PER_HOUR = 30;

export async function GET(request: Request) {
  if (
    !(await rateLimitAllow(`pondw:${clientKey(request)}`, LIMIT_PER_HOUR, 3600))
  ) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  const weather = await getDailyWeather();
  return NextResponse.json(
    { headline: weather.headline },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}
