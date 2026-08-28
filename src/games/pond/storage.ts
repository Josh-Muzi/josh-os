"use client";

/**
 * POND.EXE localStorage persistence: the Fish-Dex, lifetime records,
 * and the seen-intro flag. Sprite seeds + hue are stored per species
 * so the same fish always re-renders identically (and so AQUARIUM.SCR
 * stays possible later).
 */
import type { BaitId, PondSpot } from "./rarity";
import type { FishVariant } from "./sprite/palette";
import type { CatchResult, Rarity } from "./types";

const KEY = "joshos.pond.v1";

export interface DexEntry {
  name: string;
  flavor: string;
  rarity: Rarity;
  seed: string; // sprite seed of the first catch of this species
  hue?: number;
  count: number;
  goldenCount: number;
  bestSizeCm: number;
  firstCaughtAt: number; // epoch ms
}

export interface PondRecords {
  casts: number;
  catches: number;
  goldens: number;
  bestSizeCm: number;
}

export interface PondState {
  dex: Record<string, DexEntry>; // keyed by lowercased species name
  records: PondRecords;
  seenIntro: boolean;
  spot: PondSpot;
  activeBait: BaitId;
  /** Remaining casts per purchased bait. */
  baits: Record<Exclude<BaitId, "bare">, number>;
}

export function emptyPondState(): PondState {
  return {
    dex: {},
    records: { casts: 0, catches: 0, goldens: 0, bestSizeCm: 0 },
    seenIntro: false,
    spot: "lake",
    activeBait: "bare",
    baits: { worm: 0, floppy: 0, ram: 0 },
  };
}

export function loadPondState(): PondState {
  if (typeof window === "undefined") return emptyPondState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyPondState();
    const parsed = JSON.parse(raw) as Partial<PondState>;
    const base = emptyPondState();
    return {
      dex: parsed.dex && typeof parsed.dex === "object" ? parsed.dex : base.dex,
      records: { ...base.records, ...parsed.records },
      seenIntro: parsed.seenIntro === true,
      spot: parsed.spot ?? base.spot,
      activeBait: parsed.activeBait ?? base.activeBait,
      baits: { ...base.baits, ...parsed.baits },
    };
  } catch {
    return emptyPondState();
  }
}

export function savePondState(state: PondState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked/full: play on, progress just won't persist.
  }
}

/** Pure update: fold a resolved catch into dex + records. */
export function recordCatch(
  state: PondState,
  result: CatchResult & { variant: FishVariant },
): PondState {
  const key = result.name.trim().toLowerCase();
  const existing = state.dex[key];
  const entry: DexEntry = existing
    ? {
        ...existing,
        count: existing.count + 1,
        goldenCount:
          existing.goldenCount + (result.variant === "golden" ? 1 : 0),
        bestSizeCm: Math.max(existing.bestSizeCm, result.sizeCm),
      }
    : {
        name: result.name,
        flavor: result.flavor,
        rarity: result.rarity,
        seed: result.seed,
        hue: result.hue,
        count: 1,
        goldenCount: result.variant === "golden" ? 1 : 0,
        bestSizeCm: result.sizeCm,
        firstCaughtAt: Date.now(),
      };
  return {
    ...state,
    dex: { ...state.dex, [key]: entry },
    records: {
      ...state.records,
      catches: state.records.catches + 1,
      goldens: state.records.goldens + (result.variant === "golden" ? 1 : 0),
      bestSizeCm: Math.max(state.records.bestSizeCm, result.sizeCm),
    },
  };
}
