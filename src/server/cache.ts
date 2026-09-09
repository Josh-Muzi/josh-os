/**
 * TTL cache for AI-generated content, shared by all JoshOS games.
 * Backed by kv.ts: durable (Upstash Redis) on Vercel when configured,
 * per-instance memory otherwise. Async so call sites can't tell the
 * difference. A durable cache is a cost feature: POND's species pool
 * and daily weather are reused across every serverless instance
 * instead of being regenerated on each cold start.
 */
import { kvGetJson, kvSetJson } from "./kv";

const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60; // "no expiry" in practice

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  const value = await kvGetJson<T>(key);
  return value === null ? undefined : value;
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlMs?: number,
): Promise<void> {
  const ttlSeconds =
    ttlMs === undefined
      ? DEFAULT_TTL_SECONDS
      : Math.max(1, Math.round(ttlMs / 1000));
  await kvSetJson(key, value, ttlSeconds);
}
