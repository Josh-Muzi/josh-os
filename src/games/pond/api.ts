/**
 * Client-side API helpers for POND.EXE.
 * Every call is failure-tolerant: null means "use the offline
 * fallback" — the game must never break because the AI is down.
 */
import type { BaitId, PondSpot } from "./rarity";
import type { FishVariant } from "./sprite/palette";
import type { Rarity } from "./types";

export interface RemoteIdentity {
  name: string;
  flavor: string;
  hue: number;
}

const FETCH_TIMEOUT_MS = 7000;

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCatchIdentity(params: {
  rarity: Rarity;
  spot: PondSpot;
  sizeCm: number;
  variant: FishVariant;
  bait: BaitId;
}): Promise<RemoteIdentity | null> {
  const data = await fetchJson("/api/pond/catch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...params,
      // Glitched is shelved; the API only accepts normal | golden.
      variant: params.variant === "golden" ? "golden" : "normal",
    }),
  });
  if (
    data &&
    typeof data === "object" &&
    "name" in data &&
    "flavor" in data &&
    "hue" in data
  ) {
    return data as RemoteIdentity;
  }
  return null;
}

export async function fetchWeatherHeadline(): Promise<string | null> {
  const data = await fetchJson("/api/pond/weather");
  if (data && typeof data === "object" && "headline" in data) {
    return String((data as { headline: unknown }).headline);
  }
  return null;
}
