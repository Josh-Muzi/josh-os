/**
 * DERBY.EXE odds: price each racer by Monte Carlo — run the sim many
 * times on throwaway seeds, count wins, convert to decimal odds with
 * a house edge, and offer a classic fractional approximation.
 */
import { simulateRace } from "./sim";
import type { RaceCard } from "./types";

const HOUSE_EDGE = 0.9; // payout = 90% of fair value
const MIN_DECIMAL = 1.05;
const MAX_DECIMAL = 50;

export interface RacerOdds {
  winProbability: number;
  /** Total-return multiplier, e.g. 2.4 means bet 100 -> get 240. */
  decimal: number;
  /** Classic track display, e.g. "7:5". */
  fractional: string;
}

/** Fractional ladder from track tradition; nearest match wins. */
const LADDER: Array<[number, string]> = [
  [0.2, "1:5"],
  [0.25, "1:4"],
  [0.33, "1:3"],
  [0.4, "2:5"],
  [0.5, "1:2"],
  [0.6, "3:5"],
  [0.8, "4:5"],
  [1, "1:1"],
  [1.2, "6:5"],
  [1.4, "7:5"],
  [1.5, "3:2"],
  [2, "2:1"],
  [2.5, "5:2"],
  [3, "3:1"],
  [4, "4:1"],
  [5, "5:1"],
  [6, "6:1"],
  [8, "8:1"],
  [10, "10:1"],
  [15, "15:1"],
  [20, "20:1"],
  [33, "33:1"],
  [49, "49:1"],
];

function toFractional(decimal: number): string {
  const profit = decimal - 1;
  let best = LADDER[0];
  for (const rung of LADDER) {
    if (Math.abs(rung[0] - profit) < Math.abs(best[0] - profit)) best = rung;
  }
  return best[1];
}

export function priceRace(
  card: RaceCard,
  raceSeed: string,
  runs = 200,
): RacerOdds[] {
  const wins = new Array<number>(card.racers.length).fill(0);
  for (let run = 0; run < runs; run++) {
    // Pricing seeds are derived from (not equal to) the official seed,
    // so the priced distribution matches the sim without leaking the
    // actual result.
    const result = simulateRace(card, `${raceSeed}:mc:${run}`);
    wins[result.finishOrder[0]]++;
  }
  return wins.map((count) => {
    // Laplace smoothing: nobody is ever a literal 0% or 100%.
    const probability = (count + 1) / (runs + card.racers.length);
    const decimal = Math.min(
      MAX_DECIMAL,
      Math.max(MIN_DECIMAL, (1 / probability) * HOUSE_EDGE),
    );
    const rounded = Math.round(decimal * 10) / 10;
    return {
      winProbability: probability,
      decimal: rounded,
      fractional: toFractional(rounded),
    };
  });
}
