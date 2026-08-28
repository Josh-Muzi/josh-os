/** Rarity + variant rolls and reel behavior tuning. All code, no LLM. */

import type { FishVariant } from "./sprite/palette";
import type { Rarity } from "./types";

export type PondSpot = "lake" | "sewer" | "cloud" | "abyss";
export type BaitId = "bare" | "worm" | "floppy" | "ram";

/** 1 in N casts is a ??? anomaly, overriding the normal rarity roll. */
export const ANOMALY_ODDS = 500;

/** Deeper spots fish better. Weights are common/uncommon/rare/legendary. */
const SPOT_WEIGHTS: Record<PondSpot, [number, number, number, number]> = {
  lake: [0.62, 0.25, 0.11, 0.02],
  sewer: [0.55, 0.28, 0.14, 0.03],
  cloud: [0.48, 0.3, 0.17, 0.05],
  abyss: [0.4, 0.3, 0.22, 0.08],
};

/** Bait shifts weight out of common into rare/legendary. */
const BAIT_BONUS: Record<BaitId, { rare: number; legendary: number }> = {
  bare: { rare: 0, legendary: 0 },
  worm: { rare: 0.02, legendary: 0 },
  floppy: { rare: 0.03, legendary: 0.01 },
  ram: { rare: 0.05, legendary: 0.03 },
};

export function rollRarity(spot: PondSpot, bait: BaitId): Rarity {
  if (Math.random() < 1 / ANOMALY_ODDS) return "anomaly";
  const [common, uncommon, rare, legendary] = SPOT_WEIGHTS[spot];
  const bonus = BAIT_BONUS[bait];
  const weights: Array<[Rarity, number]> = [
    ["common", common - bonus.rare - bonus.legendary],
    ["uncommon", uncommon],
    ["rare", rare + bonus.rare],
    ["legendary", legendary + bonus.legendary],
  ];
  let roll = Math.random();
  for (const [rarity, weight] of weights) {
    if (roll < weight) return rarity;
    roll -= weight;
  }
  return "common";
}

/** Golden 1/300. Glitched exists in the sprite layer but is shelved. */
export function rollVariant(): FishVariant {
  return Math.random() < 1 / 300 ? "golden" : "normal";
}

export function rollSizeCm(rarity: Rarity, reelScore: number): number {
  const range: Record<Rarity, [number, number]> = {
    common: [8, 25],
    uncommon: [15, 45],
    rare: [30, 80],
    legendary: [60, 150],
    anomaly: [1, 400], // anomalies obey no sizing conventions
  };
  const [min, max] = range[rarity];
  const base = min + Math.random() * (max - min);
  return Math.round(base * (0.8 + 0.4 * reelScore));
}

/**
 * Reel-zone behavior per rarity: the pre-reveal "tell".
 * Commons drift lazily; legendaries twitch and dart.
 * Returns the zone center (0..1) at time t (seconds).
 */
export function zoneCenterAt(rarity: Rarity, t: number, seed: number): number {
  const s = seed * 0.017;
  switch (rarity) {
    case "common":
      return 0.5 + 0.22 * Math.sin(t * 0.9 + s);
    case "uncommon":
      return 0.5 + 0.28 * Math.sin(t * 1.6 + s) * Math.cos(t * 0.7);
    case "rare":
      return (
        0.5 + 0.3 * Math.sin(t * 2.6 + s) + 0.12 * Math.sin(t * 6.3 + s * 2)
      );
    case "legendary": {
      // Darting: smooth base + step jumps every ~1.2s.
      const dart = Math.sin(Math.floor(t / 1.2) * 7.31 + s) * 0.32;
      return 0.5 + 0.2 * Math.sin(t * 3.1 + s) + dart;
    }
    case "anomaly": {
      // Wrong on purpose: fast jitter + jumps twice as often.
      const glitch = Math.sin(Math.floor(t / 0.6) * 11.7 + s) * 0.34;
      return 0.5 + 0.16 * Math.sin(t * 5.2 + s * 3) + glitch;
    }
  }
}

export const ZONE_WIDTH: Record<Rarity, number> = {
  common: 0.3,
  uncommon: 0.26,
  rare: 0.22,
  legendary: 0.18,
  anomaly: 0.16,
};

export const REEL_SECONDS = 5;

/** JoshBucks sale value for a catch. Goldens are the jackpot. */
export function sellPrice(
  rarity: Rarity,
  sizeCm: number,
  variant: FishVariant,
): number {
  const base: Record<Rarity, number> = {
    common: 5,
    uncommon: 15,
    rare: 50,
    legendary: 250,
    anomaly: 1000,
  };
  const sizeMax: Record<Rarity, number> = {
    common: 25,
    uncommon: 45,
    rare: 80,
    legendary: 150,
    anomaly: 400,
  };
  const sizeFactor = 0.75 + Math.min(1.5, sizeCm / sizeMax[rarity]);
  const goldMultiplier = variant === "golden" ? 10 : 1;
  return Math.max(1, Math.round(base[rarity] * sizeFactor * goldMultiplier));
}
