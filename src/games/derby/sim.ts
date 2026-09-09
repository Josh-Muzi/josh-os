/**
 * DERBY.EXE race simulation. Fully deterministic from (card, seed):
 * the server simulates once for official results, the client replays
 * the identical sim for smooth rendering, and Monte Carlo pricing
 * runs it in fast mode. RNG consumption order is FIXED (racers in
 * index order per tick) — do not reorder loops or determinism breaks.
 */
import { createRng } from "../pond/sprite/rng";
import type { TraitHooks } from "./traits";
import { TRAITS } from "./traits";
import type { ChaosEventType, RaceCard, RaceEvent, SimResult } from "./types";

export const TRACK_LENGTH = 1000;
export const TICKS_PER_SECOND = 30;
const MAX_TICKS = 45 * TICKS_PER_SECOND;

interface RacerSim {
  position: number;
  finished: boolean;
  finishTick: number;
  /** Ticks remaining on the active chaos event. */
  eventTicks: number;
  eventType: ChaosEventType | null;
  /** Smoothed per-racer pace noise. */
  wander: number;
}

const EVENT_TYPES: ChaosEventType[] = ["stall", "burst", "wrongway", "nap"];

const EVENT_DURATION: Record<ChaosEventType, [number, number]> = {
  stall: [24, 48],
  burst: [14, 24],
  wrongway: [10, 20],
  nap: [40, 70],
};

const EVENT_SPEED: Record<ChaosEventType, number> = {
  stall: 0,
  burst: 1.85,
  wrongway: -0.45,
  nap: 0,
};

/** Base pace per tick from the speed stat (1-10). Tuned for ~30s races.
 * The spread is deliberately narrow: rubber-banding, wander, stamina
 * fade, and chaos must all be able to overturn a raw speed edge, or
 * favorites become locks and betting dies. */
function basePace(speed: number): number {
  return 1.12 + speed * 0.028;
}

/** Late-race fade from the stamina stat (1-10). */
function staminaFactor(progress: number, stamina: number): number {
  const fadeStart = 0.5;
  if (progress <= fadeStart) return 1;
  return 1 - (progress - fadeStart) * (10 - stamina) * 0.072;
}

/** Merge a racer's trait hooks into one effective set. */
function mergeHooks(
  traitIds: RaceCard["racers"][number]["traits"],
): TraitHooks {
  const merged: TraitHooks = {};
  for (const id of traitIds) {
    const hooks = TRAITS[id]?.hooks;
    if (!hooks) continue;
    merged.paceMult = (merged.paceMult ?? 1) * (hooks.paceMult ?? 1);
    merged.startMult = (merged.startMult ?? 1) * (hooks.startMult ?? 1);
    merged.finishMult = (merged.finishMult ?? 1) * (hooks.finishMult ?? 1);
    merged.whenLeadingMult =
      (merged.whenLeadingMult ?? 1) * (hooks.whenLeadingMult ?? 1);
    merged.whenLastMult =
      (merged.whenLastMult ?? 1) * (hooks.whenLastMult ?? 1);
    merged.wanderScale = (merged.wanderScale ?? 1) * (hooks.wanderScale ?? 1);
    merged.stallScale = (merged.stallScale ?? 1) * (hooks.stallScale ?? 1);
    merged.immuneWrongway = merged.immuneWrongway || hooks.immuneWrongway;
    if (hooks.eventBias) {
      merged.eventBias = merged.eventBias ?? {};
      for (const [type, weight] of Object.entries(hooks.eventBias)) {
        const key = type as ChaosEventType;
        merged.eventBias[key] = (merged.eventBias[key] ?? 1) * weight;
      }
    }
  }
  return merged;
}

/** Weighted event-type pick from a single RNG roll (order is fixed). */
function pickEventType(roll: number, hooks: TraitHooks): ChaosEventType {
  const weights = EVENT_TYPES.map((t) => hooks.eventBias?.[t] ?? 1);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let cursor = roll * total;
  for (let i = 0; i < EVENT_TYPES.length; i++) {
    if (cursor < weights[i]) return EVENT_TYPES[i];
    cursor -= weights[i];
  }
  return EVENT_TYPES[EVENT_TYPES.length - 1];
}

export interface SimOptions {
  /** Store per-tick positions (client replay). Off for Monte Carlo. */
  collectFrames?: boolean;
  /** Log overtake events (adds noise to Monte Carlo; on for official). */
  logOvertakes?: boolean;
}

export function simulateRace(
  card: RaceCard,
  seed: string,
  options: SimOptions = {},
): SimResult {
  const rng = createRng(`derby:${seed}`);
  const racers: RacerSim[] = card.racers.map(() => ({
    position: 0,
    finished: false,
    finishTick: 0,
    eventTicks: 0,
    eventType: null,
    wander: 1,
  }));
  const events: RaceEvent[] = [];
  const frames: number[][] = [];
  const finishOrder: number[] = [];
  let previousLeader = -1;
  const hooksById = card.racers.map((racer) => mergeHooks(racer.traits));

  let tick = 0;
  for (
    tick = 0;
    tick < MAX_TICKS && finishOrder.length < racers.length;
    tick++
  ) {
    // Mean position of unfinished racers, for rubber-banding.
    const running = racers.filter((r) => !r.finished);
    const meanPos =
      running.reduce((sum, r) => sum + r.position, 0) / (running.length || 1);
    // Current leader/tailender among unfinished (for trait hooks).
    let leadIndex = -1;
    let lastIndex = -1;
    let bestPos = -1;
    let worstPos = Number.POSITIVE_INFINITY;
    for (let i = 0; i < racers.length; i++) {
      if (racers[i].finished) continue;
      if (racers[i].position > bestPos) {
        bestPos = racers[i].position;
        leadIndex = i;
      }
      if (racers[i].position < worstPos) {
        worstPos = racers[i].position;
        lastIndex = i;
      }
    }

    for (let i = 0; i < racers.length; i++) {
      const racer = racers[i];
      if (racer.finished) {
        rng.next(); // keep RNG consumption constant per tick
        continue;
      }
      const stats = card.racers[i].stats;
      const hooks = hooksById[i];

      // Chaos: maybe start an event when idle.
      if (racer.eventTicks <= 0 && rng.chance(stats.chaos * 0.00022)) {
        let type = pickEventType(rng.next(), hooks);
        if (type === "wrongway" && hooks.immuneWrongway) type = "stall";
        const [min, max] = EVENT_DURATION[type];
        const scale =
          type === "stall" || type === "nap" ? (hooks.stallScale ?? 1) : 1;
        racer.eventType = type;
        racer.eventTicks = Math.round(
          (min + Math.floor(rng.next() * (max - min))) * scale,
        );
        events.push({ tick, racer: i, type });
      }

      // Smoothed wander keeps pace organic without jitter; traits can
      // steady it or unhinge it.
      const rawWander = 0.82 + rng.next() * 0.36;
      const scaledWander = 1 + (rawWander - 1) * (hooks.wanderScale ?? 1);
      racer.wander = racer.wander * 0.96 + scaledWander * 0.04;

      const progress = racer.position / TRACK_LENGTH;
      let velocity =
        basePace(stats.speed) *
        staminaFactor(progress, stats.stamina) *
        racer.wander;

      // Trait phase/position multipliers.
      velocity *= hooks.paceMult ?? 1;
      if (progress < 0.15) velocity *= hooks.startMult ?? 1;
      if (progress > 0.85) velocity *= hooks.finishMult ?? 1;
      if (i === leadIndex) velocity *= hooks.whenLeadingMult ?? 1;
      if (i === lastIndex) velocity *= hooks.whenLastMult ?? 1;

      // Rubber-band: trailing gets a nudge, leading gets drag.
      const gap = (meanPos - racer.position) / TRACK_LENGTH;
      velocity *= 1 + Math.max(-0.06, Math.min(0.12, gap * 1.2));

      if (racer.eventTicks > 0 && racer.eventType) {
        velocity = basePace(stats.speed) * EVENT_SPEED[racer.eventType];
        racer.eventTicks--;
      }

      racer.position = Math.max(0, racer.position + velocity);

      if (racer.position >= TRACK_LENGTH) {
        racer.finished = true;
        racer.finishTick = tick;
        racer.position = TRACK_LENGTH;
        finishOrder.push(i);
        events.push({
          tick,
          racer: i,
          type: "finish",
          detail: finishOrder.length,
        });
      }
    }

    // Overtake events for commentary (leader changes only).
    if (options.logOvertakes) {
      let leader = -1;
      let best = -1;
      for (let i = 0; i < racers.length; i++) {
        if (!racers[i].finished && racers[i].position > best) {
          best = racers[i].position;
          leader = i;
        }
      }
      if (leader !== -1 && leader !== previousLeader) {
        if (previousLeader !== -1) {
          events.push({
            tick,
            racer: leader,
            type: "overtake",
            detail: previousLeader,
          });
        }
        previousLeader = leader;
      }
    }

    if (options.collectFrames) {
      frames.push(racers.map((r) => r.position));
    }
  }

  // Anyone still running when time caps out finishes by position.
  const stragglers = racers
    .map((r, i) => ({ i, position: r.position, finished: r.finished }))
    .filter((r) => !r.finished)
    .sort((a, b) => b.position - a.position);
  for (const straggler of stragglers) finishOrder.push(straggler.i);

  return {
    finishOrder,
    events,
    durationTicks: tick,
    frames: options.collectFrames ? frames : undefined,
  };
}
