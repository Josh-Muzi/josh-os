/**
 * Durable key-value store for rate limits, budgets, and AI caches.
 *
 * On Vercel, serverless instances don't share memory, so in-memory
 * counters silently reset (weak limits, duplicate generations). When
 * UPSTASH_REDIS_REST_URL/TOKEN are set (Vercel Marketplace -> Upstash
 * Redis, free tier), everything below goes through Redis over REST.
 * Without them, it falls back to per-instance memory — fine for dev.
 */

const memory = new Map<string, { value: string; expiresAt: number }>();

function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function kvIsDurable(): boolean {
  return upstashConfig() !== null;
}

/** Run one Redis command; returns the result field or null on failure. */
async function redis<T>(command: (string | number)[]): Promise<T | null> {
  const config = upstashConfig();
  if (!config) return null;
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { result?: T };
    return data.result ?? null;
  } catch {
    return null; // never let the store take the game down
  }
}

/** Atomic counter with a TTL set on first increment. Returns the new count. */
export async function kvIncr(key: string, ttlSeconds: number): Promise<number> {
  if (kvIsDurable()) {
    const count = await redis<number>(["INCR", key]);
    if (count === null) return 1; // store down: fail open, per-instance
    if (count === 1) await redis(["EXPIRE", key, ttlSeconds]);
    return count;
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.expiresAt < now) {
    memory.set(key, { value: "1", expiresAt: now + ttlSeconds * 1000 });
    return 1;
  }
  const next = Number(entry.value) + 1;
  entry.value = String(next);
  return next;
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
  if (kvIsDurable()) {
    const raw = await redis<string>(["GET", key]);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  const entry = memory.get(key);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return JSON.parse(entry.value) as T;
}

export async function kvSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const raw = JSON.stringify(value);
  if (kvIsDurable()) {
    await redis(["SET", key, raw, "EX", ttlSeconds]);
    return;
  }
  memory.set(key, { value: raw, expiresAt: Date.now() + ttlSeconds * 1000 });
}
