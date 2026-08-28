/**
 * Fish palettes. Index meanings are fixed; colors vary per fish.
 * 0 transparent | 1 outline | 2 body | 3 pattern | 4 belly
 * 5 fin | 6 eye white | 7 pupil | 8 accent (sparkle/glitch)
 */
import { createRng } from "./rng";

export type FishVariant = "normal" | "golden" | "glitched";

export interface FishPalette {
  colors: string[]; // length 9, colors[0] unused (transparent)
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(((h % 360) + 360) % 360)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

/**
 * Seeded palette. Later, the LLM can override the base hue/mood via
 * `hueOverride` while everything else stays deterministic.
 */
export function generatePalette(
  seed: string,
  hueOverride?: number,
): FishPalette {
  const rng = createRng(`${seed}:palette`);
  const h = hueOverride ?? rng.next() * 360;
  const patternShift = rng.pick([30, -30, 140, 180, -120]);
  const sat = rng.int(55, 80);
  const colors = [
    "transparent",
    hsl(h, sat * 0.7, 14), // outline: near-black of body hue
    hsl(h, sat, rng.int(42, 54)), // body
    hsl(h + patternShift, sat, rng.int(38, 60)), // pattern
    hsl(h, sat * 0.45, 82), // belly
    hsl(h + rng.pick([-25, 20, patternShift]), sat, 32), // fin
    "#f8f6ee", // eye white
    "#14141c", // pupil
    hsl(h + 180, 90, 65), // accent
  ];
  return { colors };
}

/** Golden variant: fixed treasure-gold ramp, keeps fish shape identical. */
export function goldenPalette(): FishPalette {
  return {
    colors: [
      "transparent",
      hsl(42, 70, 16),
      hsl(45, 85, 52),
      hsl(38, 90, 42),
      hsl(50, 75, 78),
      hsl(36, 80, 34),
      "#fffdf2",
      "#1a1408",
      hsl(52, 100, 72),
    ],
  };
}
