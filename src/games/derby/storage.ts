"use client";

/**
 * DERBY.EXE persistence: race history, lifetime records, and
 * Vincent's ledger (how many times he's bailed you out).
 */

const KEY = "joshos.derby.v1";
const HISTORY_CAP = 10;

export interface RaceRecordEntry {
  seed: string;
  racer: string;
  amount: number;
  /** Net result: positive profit or negative loss. */
  net: number;
  at: number;
}

export interface DerbyRecords {
  bets: number;
  wins: number;
  biggestWin: number;
  biggestLoss: number;
  currentLoseStreak: number;
  longestLoseStreak: number;
}

export interface DerbyState {
  history: RaceRecordEntry[];
  records: DerbyRecords;
  shark: { count: number; lastSeed: string | null };
}

export function emptyDerbyState(): DerbyState {
  return {
    history: [],
    records: {
      bets: 0,
      wins: 0,
      biggestWin: 0,
      biggestLoss: 0,
      currentLoseStreak: 0,
      longestLoseStreak: 0,
    },
    shark: { count: 0, lastSeed: null },
  };
}

export function loadDerbyState(): DerbyState {
  if (typeof window === "undefined") return emptyDerbyState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyDerbyState();
    const parsed = JSON.parse(raw) as Partial<DerbyState>;
    const base = emptyDerbyState();
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
      records: { ...base.records, ...parsed.records },
      shark: { ...base.shark, ...parsed.shark },
    };
  } catch {
    return emptyDerbyState();
  }
}

export function saveDerbyState(state: DerbyState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: play on without persistence.
  }
}

/** Pure update: fold a settled bet into history + records. */
export function recordResult(
  state: DerbyState,
  entry: Omit<RaceRecordEntry, "at">,
): DerbyState {
  const won = entry.net > 0;
  const r = state.records;
  const currentLoseStreak = won ? 0 : r.currentLoseStreak + 1;
  return {
    ...state,
    history: [{ ...entry, at: Date.now() }, ...state.history].slice(
      0,
      HISTORY_CAP,
    ),
    records: {
      bets: r.bets + 1,
      wins: r.wins + (won ? 1 : 0),
      biggestWin: Math.max(r.biggestWin, won ? entry.net : 0),
      biggestLoss: Math.max(r.biggestLoss, won ? 0 : -entry.net),
      currentLoseStreak,
      longestLoseStreak: Math.max(r.longestLoseStreak, currentLoseStreak),
    },
  };
}

/** Pure update: Vincent has helped you. Again. */
export function recordShark(state: DerbyState, seed: string): DerbyState {
  return {
    ...state,
    shark: { count: state.shark.count + 1, lastSeed: seed },
  };
}
