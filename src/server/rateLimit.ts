/**
 * Request guards for the paid AI routes. Three layers:
 *  1. rateLimit  — per-IP fixed window (durable via kv.ts)
 *  2. budget     — GLOBAL daily cap per feature; the cost ceiling
 *  3. sameOrigin — browsers must call from this site, not from
 *                  another page embedding our endpoint
 * Plus the AI_GAMES_DISABLED kill switch in anthropic.ts as the
 * final backstop. Every guard fails toward the offline fallback,
 * never toward an error the player sees.
 */
import { kvIncr } from "./kv";

/** Best-effort client key (first hop of x-forwarded-for). */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}

/** True when `key` is still under `limit` hits in the current window. */
export async function rateLimitAllow(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const count = await kvIncr(`rl:${key}:${bucket}`, windowSeconds + 5);
  return count <= limit;
}

/**
 * Global daily budget per feature (UTC day). Defaults are sized for a
 * ~$20-40/mo worst case; override per feature with env vars like
 * BUDGET_DERBY_PER_DAY. Over budget = graceful fallback content.
 */
export async function budgetAllow(
  feature: "derby" | "pond" | "weather",
  defaultPerDay: number,
): Promise<boolean> {
  const override = Number(
    process.env[`BUDGET_${feature.toUpperCase()}_PER_DAY`],
  );
  const cap =
    Number.isFinite(override) && override > 0 ? override : defaultPerDay;
  const day = new Date().toISOString().slice(0, 10);
  const count = await kvIncr(`budget:${feature}:${day}`, 26 * 60 * 60);
  return count <= cap;
}

/**
 * Reject cross-site browser calls. Browsers send Origin on POST and
 * fetch(); if it's present and isn't us, refuse. Requests without an
 * Origin (curl, same-origin GET navigations) still face the limits.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
