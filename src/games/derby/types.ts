/** DERBY.EXE shared types. */
import type { TraitId } from "./traits";

export interface RacerStats {
  /** 1-10: base pace. */
  speed: number;
  /** 1-10: resistance to late-race fade. */
  stamina: number;
  /** 1-10: probability of visible chaos events (the gimmick made real). */
  chaos: number;
}

export interface RacerCard {
  name: string;
  /** One-line personality that should predict behavior. */
  gimmick: string;
  stats: RacerStats;
  /** One funny trait with real sim mechanics (see traits.ts). */
  traits: TraitId[];
  /** Base sprite hue 0-359. */
  hue: number;
}

export interface RaceCard {
  racers: RacerCard[]; // always 6
}

export type ChaosEventType = "stall" | "burst" | "wrongway" | "nap";

export interface RaceEvent {
  tick: number;
  racer: number; // index into card.racers
  type: ChaosEventType | "finish" | "overtake";
  /** For finish: final position (1-6). For overtake: index passed. */
  detail?: number;
}

export interface SimResult {
  /** Racer indices in finishing order. */
  finishOrder: number[];
  events: RaceEvent[];
  durationTicks: number;
  /** Per-tick positions [tick][racer] in 0..TRACK_LENGTH, if collected. */
  frames?: number[][];
}
