/**
 * DERBY.EXE trait system (Josh's request): every racer carries one
 * funny trait that REALLY affects the sim. Hybrid rule: code owns the
 * mechanics below; generators (local or LLM) only pick trait ids and
 * write flavor around them. Traits are visible on the betting board,
 * so reading them is part of handicapping.
 */
import type { ChaosEventType } from "./types";

export interface TraitHooks {
  /** Flat pace multiplier. */
  paceMult?: number;
  /** Pace multiplier during the first 15% of the track. */
  startMult?: number;
  /** Pace multiplier during the last 15% of the track. */
  finishMult?: number;
  /** Applied while holding the lead. */
  whenLeadingMult?: number;
  /** Applied while running dead last. */
  whenLastMult?: number;
  /** Scales the wander deviation (1 = normal). */
  wanderScale?: number;
  /** Multiplies the relative weight of chaos event types. */
  eventBias?: Partial<Record<ChaosEventType, number>>;
  /** Scales stall/nap durations. */
  stallScale?: number;
  /** Never runs the wrong way. */
  immuneWrongway?: boolean;
}

export interface TraitDef {
  id: TraitId;
  label: string;
  /** Short board hint at what it does, without exact numbers. */
  blurb: string;
  hooks: TraitHooks;
}

export type TraitId =
  | "morning_person"
  | "not_morning"
  | "drama_queen"
  | "stage_fright"
  | "something_to_prove"
  | "unionized"
  | "energy_drink"
  | "emotionally_stable"
  | "coin_flip"
  | "built_like_fridge"
  | "legs_too_small"
  | "main_character";

export const TRAITS: Record<TraitId, TraitDef> = {
  morning_person: {
    id: "morning_person",
    label: "Morning person",
    blurb: "explodes out of the gate",
    hooks: { startMult: 1.15 },
  },
  not_morning: {
    id: "not_morning",
    label: "Not a morning person",
    blurb: "wakes up eventually",
    hooks: { startMult: 0.9, finishMult: 1.06 },
  },
  drama_queen: {
    id: "drama_queen",
    label: "Drama queen",
    blurb: "only tries when it matters",
    hooks: { startMult: 0.92, finishMult: 1.1 },
  },
  stage_fright: {
    id: "stage_fright",
    label: "Stage fright",
    blurb: "hates being watched in front",
    hooks: { whenLeadingMult: 0.965 },
  },
  something_to_prove: {
    id: "something_to_prove",
    label: "Something to prove",
    blurb: "dangerous in last place",
    hooks: { whenLastMult: 1.1 },
  },
  unionized: {
    id: "unionized",
    label: "Union member",
    blurb: "breaks are mandatory",
    hooks: { eventBias: { nap: 3 }, stallScale: 1.2 },
  },
  energy_drink: {
    id: "energy_drink",
    label: "Sponsored by energy drink",
    blurb: "prone to sudden bursts",
    hooks: { eventBias: { burst: 3 } },
  },
  emotionally_stable: {
    id: "emotionally_stable",
    label: "Emotionally stable",
    blurb: "runs the same race every time",
    hooks: { wanderScale: 0.55 },
  },
  coin_flip: {
    id: "coin_flip",
    label: "Coin-flip enjoyer",
    blurb: "who knows, honestly",
    hooks: { wanderScale: 1.45 },
  },
  built_like_fridge: {
    id: "built_like_fridge",
    label: "Built like a fridge",
    blurb: "slow, but never gets turned around",
    hooks: { paceMult: 0.995, immuneWrongway: true },
  },
  legs_too_small: {
    id: "legs_too_small",
    label: "Legs too small",
    blurb: "fast little steps, long little naps",
    hooks: { paceMult: 1.012, stallScale: 1.6 },
  },
  main_character: {
    id: "main_character",
    label: "Main character energy",
    blurb: "thrives in front, sulks in back",
    hooks: { whenLeadingMult: 1.03, whenLastMult: 0.97 },
  },
};

export const TRAIT_IDS = Object.keys(TRAITS) as TraitId[];
