/** Shared POND.EXE game types. */
import type { FishVariant } from "./sprite/palette";

export type Rarity = "common" | "uncommon" | "rare" | "legendary" | "anomaly";

export type GamePhase =
  | "menu" // title screen with instructions
  | "idle" // rod ready, waiting for cast
  | "waiting" // bobber out, fish deciding
  | "bite" // short reaction window
  | "reeling" // hold-the-zone minigame
  | "caught" // catch card showing
  | "escaped"; // missed the bite

export interface CatchResult {
  seed: string;
  name: string;
  flavor: string;
  rarity: Rarity;
  variant: FishVariant;
  sizeCm: number;
  /** True when the reel was worked at >= 85% in-zone. */
  perfect: boolean;
  /** LLM-chosen base hue (0-359) for the sprite; unset = seeded palette. */
  hue?: number;
  /** True while the identity is still being fetched from the AI route. */
  pending?: boolean;
  /** JoshBucks the fish sold for (set when the identity resolves). */
  soldFor?: number;
}

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "LEGENDARY",
  anomaly: "???",
};
