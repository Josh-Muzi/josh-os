/**
 * Per-key sliding-window rate limiter for AI routes.
 * In-memory (per instance) — same production caveat as cache.ts.
 */

const windows = new Map<string, number[]>();

/**
 * Returns true when the caller identified by `key` is allowed another
 * hit within `windowMs`, false when they are over `limit`.
 */
export function rateLimitAllow(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    windows.set(key, hits);
    return false;
  }
  hits.push(now);
  windows.set(key, hits);
  return true;
}

/** Best-effort client key from a Next.js request. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}
