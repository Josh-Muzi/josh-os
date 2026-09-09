/**
 * Local race-card generator (D2 placeholder — the D3 AI route replaces
 * the identity layer with the same shape). Names deliberately mix
 * funny, cute, regular-horse, and tech pools per Josh's direction:
 * the field should feel like a raffle at a weird county fair, not a
 * programming joke contest.
 */

import type { Rng } from "../pond/sprite/rng";
import { createRng } from "../pond/sprite/rng";
import { TRAIT_IDS } from "./traits";
import type { RaceCard, RacerCard, RacerStats } from "./types";

const NAMES: string[][] = [
  // funny
  [
    "Gerald",
    "Free Trial",
    "Left Sock",
    "The Landlord",
    "Homework",
    "Wet Bread",
    "Jeff From Work",
    "Horse 2",
    "Tax Season",
    "Lunch Thief",
  ],
  // cute
  [
    "Sprinkles",
    "Waffle",
    "Bean",
    "Mochi",
    "Buttons",
    "Pickles",
    "Clementine",
    "Noodle",
    "Pumpkin",
    "Biscuit",
  ],
  // regular (track classics)
  [
    "Midnight Star",
    "Thunderhoof",
    "Copper Canyon",
    "Silver Gale",
    "Northern Belle",
    "Dusty Trail",
    "Iron Duchess",
    "Prairie King",
    "Golden Hour",
    "Stormline",
  ],
  // tech-cursed
  [
    "Blue Screen",
    "Dial-Up",
    "Popup Ad",
    "Lag Spike",
    "Ctrl Alt Delete",
    "404",
    "Low Battery",
    "Mandatory Update",
    "Caps Lock",
    "Airplane Mode",
  ],
];

/** Gimmick pools per archetype — the line must PREDICT the behavior. */
const GIMMICKS = {
  speedster: [
    "starts hot, finishes questionable",
    "all gas, no plan",
    "burns bright, burns out",
  ],
  closer: [
    "slow start, scary finish",
    "saving it all for the end",
    "arrives exactly when it matters",
  ],
  chaotic: [
    "may stop for no reason",
    "easily distracted",
    "obeys unknowable laws",
  ],
  steady: [
    "shows up, does the job",
    "aggressively dependable",
    "has never had a bad day",
  ],
} as const;

function archetype(stats: RacerStats): keyof typeof GIMMICKS {
  if (stats.chaos >= 7) return "chaotic";
  if (stats.speed >= 8 && stats.stamina <= 4) return "speedster";
  if (stats.stamina >= 8 && stats.speed <= 5) return "closer";
  return "steady";
}

/**
 * Budgeted stat roll, shared by the local and server generators:
 * speed + stamina live on a ~13-point budget so no racer is a strict
 * god (9/9) or dud (3/2) — degenerate fields make betting pointless
 * (the first live card priced a god-roll at 90% win).
 */
export function rollBalancedStats(rng: Rng): RacerStats {
  const speed = rng.int(3, 10);
  const stamina = Math.min(10, Math.max(2, 13 - speed + rng.int(-2, 2)));
  return { speed, stamina, chaos: rng.int(1, 9) };
}

export function generateLocalCard(seed: string): RaceCard {
  const rng = createRng(`derbycard:${seed}`);
  const used = new Set<string>();
  const racers: RacerCard[] = [];
  while (racers.length < 6) {
    const pool = NAMES[Math.floor(rng.next() * NAMES.length)];
    const name = pool[Math.floor(rng.next() * pool.length)];
    if (used.has(name)) continue;
    used.add(name);
    const stats = rollBalancedStats(rng);
    const kind = archetype(stats);
    const lines = GIMMICKS[kind];
    racers.push({
      name,
      gimmick: lines[Math.floor(rng.next() * lines.length)],
      stats,
      traits: [TRAIT_IDS[Math.floor(rng.next() * TRAIT_IDS.length)]],
      hue: Math.floor(rng.next() * 360),
    });
  }
  return { racers };
}
