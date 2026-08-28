/**
 * Tiny TTL cache for AI-generated content, shared by all JoshOS games.
 *
 * CURRENT: in-memory (per server instance). Fine for local dev; on
 * Vercel serverless it resets on cold starts, which only costs us a
 * few extra generations. TODO before heavy traffic: swap the internals
 * for Vercel KV or Convex — the call sites stay identical.
 */

interface Entry<T> {
  value: T;
  expiresAt: number; // epoch ms; Infinity = no expiry
}

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs?: number): void {
  store.set(key, {
    value,
    expiresAt:
      ttlMs === undefined ? Number.POSITIVE_INFINITY : Date.now() + ttlMs,
  });
}
