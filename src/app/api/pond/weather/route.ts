/**
 * GET /api/pond/weather — today's shared pond weather.
 * One generation per UTC day serves every visitor (cached server-side).
 */
import { NextResponse } from "next/server";
import { getDailyWeather } from "@/server/pond";
import { clientKey, rateLimitAllow } from "@/server/rateLimit";

const LIMIT_PER_HOUR = 30;
const HOUR_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  if (!rateLimitAllow(`pondw:${clientKey(request)}`, LIMIT_PER_HOUR, HOUR_MS)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  const weather = await getDailyWeather();
  return NextResponse.json({ headline: weather.headline });
}
