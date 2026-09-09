"use client";

/**
 * Client fetch for standalone DERBY races. null = use local fallback.
 */
import type { RacerOdds } from "./odds";
import type { RaceCard } from "./types";

export interface CommentaryBeat {
  atSec: number;
  text: string;
}

export interface FreshRace {
  seed: string;
  card: RaceCard;
  odds: RacerOdds[];
  commentary: CommentaryBeat[] | null;
}

// Two sequential Haiku calls + pricing measured ~13s worst case; the
// old 12s limit silently pushed players into offline fallback.
const FETCH_TIMEOUT_MS = 30000;

export async function fetchFreshRace(): Promise<FreshRace | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch("/api/derby/race", {
      method: "POST",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { race?: FreshRace };
    const race = data.race;
    // Shape check: a malformed payload falls back to local races
    // instead of crashing the render.
    if (
      !race ||
      typeof race.seed !== "string" ||
      !Array.isArray(race.card?.racers) ||
      race.card.racers.length !== 6 ||
      !Array.isArray(race.odds) ||
      race.odds.length !== 6
    ) {
      return null;
    }
    return race;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
