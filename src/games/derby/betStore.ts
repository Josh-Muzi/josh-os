"use client";

/**
 * Per-race bet persistence. The stored bet carries the race's card +
 * seed, so an interrupted race can be settled deterministically on
 * the next visit (the sim is pure — the result was always decided).
 * The settled flag makes payouts idempotent.
 */
import type { RaceCard } from "./types";

const KEY = "joshos.derby.bet.v1";

export interface StoredBet {
  seed: string;
  card: RaceCard;
  racer: number;
  amount: number;
  decimal: number;
  /** True once the race was actually started; unstarted bets refund. */
  started: boolean;
  settled: boolean;
}

export function loadBet(): StoredBet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const bet = JSON.parse(raw) as StoredBet;
    return bet && typeof bet.seed === "string" ? bet : null;
  } catch {
    return null;
  }
}

export function saveBet(bet: StoredBet): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(bet));
  } catch {
    // Storage blocked: the bet just won't survive a refresh.
  }
}
