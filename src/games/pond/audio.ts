"use client";

/**
 * Tiny synthesized sound for POND.EXE — no audio files, just the Web
 * Audio API. Muted by default; the player opts in. Every call is safe
 * when audio is unavailable or the context can't start.
 */

type Blip =
  | "cast"
  | "splash"
  | "bite"
  | "catch"
  | "legendary"
  | "escape"
  | "buy";

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One note: frequency sweep + quick envelope. */
function tone(
  ac: AudioContext,
  at: number,
  from: number,
  to: number,
  duration: number,
  type: OscillatorType,
  gain: number,
): void {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + duration);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

export function playBlip(kind: Blip): void {
  const ac = context();
  if (!ac) return;
  const t = ac.currentTime;
  switch (kind) {
    case "cast": // a quick upward whip
      tone(ac, t, 300, 900, 0.14, "square", 0.05);
      break;
    case "splash": // soft plop
      tone(ac, t, 520, 140, 0.16, "sine", 0.07);
      break;
    case "bite": // two urgent chirps
      tone(ac, t, 880, 660, 0.08, "square", 0.06);
      tone(ac, t + 0.1, 880, 660, 0.08, "square", 0.06);
      break;
    case "catch": // rising three-note ding
      tone(ac, t, 523, 523, 0.1, "triangle", 0.07);
      tone(ac, t + 0.1, 659, 659, 0.1, "triangle", 0.07);
      tone(ac, t + 0.2, 784, 784, 0.18, "triangle", 0.08);
      break;
    case "legendary": // the ding, then a shimmer on top
      tone(ac, t, 523, 523, 0.1, "triangle", 0.07);
      tone(ac, t + 0.1, 659, 659, 0.1, "triangle", 0.07);
      tone(ac, t + 0.2, 784, 784, 0.12, "triangle", 0.08);
      tone(ac, t + 0.32, 1047, 1047, 0.28, "triangle", 0.08);
      tone(ac, t + 0.34, 1568, 2093, 0.3, "sine", 0.03);
      break;
    case "escape": // sad little slide down
      tone(ac, t, 440, 180, 0.28, "sawtooth", 0.035);
      break;
    case "buy": // cash-register tick
      tone(ac, t, 1200, 1200, 0.05, "square", 0.04);
      tone(ac, t + 0.06, 1600, 1600, 0.07, "square", 0.04);
      break;
  }
}
