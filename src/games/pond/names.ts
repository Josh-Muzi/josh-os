/**
 * PLACEHOLDER fish identity generator.
 * Phase 3 replaces this with the LLM route; keep the same signature.
 * Deterministic from seed so the same fish always has the same name.
 */
import { createRng } from "./sprite/rng";
import type { Rarity } from "./types";

const ADJECTIVES = [
  "Murky",
  "Dial-Up",
  "Beta",
  "Sleepy",
  "Chrome",
  "Pixel",
  "Backup",
  "Laggy",
  "Vintage",
  "Suspicious",
  "Deluxe",
  "Shareware",
  "Corrupted",
  "Refurbished",
  "Overclocked",
  "Discount",
];

const NOUNS = [
  "Carp",
  "Bass",
  "Minnow",
  "Gulper",
  "Trout",
  "Snapper",
  "Eel",
  "Guppy",
  "Perch",
  "Blob",
  "Sardine",
  "Koi",
  "Flounder",
  "Chub",
  "Darter",
  "Loach",
];

const FLAVOR = [
  "Refuses to load.",
  "Smells faintly of 1998.",
  "Found sleeping near the firewall.",
  "Warranty voided at birth.",
  "Blinks in 8-bit color only.",
  "Migrates between folders at night.",
  "Compressed for your convenience.",
  "Still buffering.",
  "Runs best on 640x480.",
  "Has never known broadband.",
];

export interface FishIdentity {
  name: string;
  flavor: string;
}

export function placeholderIdentity(
  seed: string,
  rarity: Rarity,
): FishIdentity {
  const rng = createRng(`${seed}:name`);
  const adjective = rng.pick(ADJECTIVES);
  const noun = rng.pick(NOUNS);
  const prefix = rarity === "legendary" ? "The " : "";
  return {
    name: `${prefix}${adjective} ${noun}`,
    flavor: rng.pick(FLAVOR),
  };
}
