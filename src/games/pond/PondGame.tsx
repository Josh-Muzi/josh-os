"use client";

/**
 * POND.EXE — the game.
 * Cast -> wait -> bite (reaction) -> reel (hold needle in zone) -> catch.
 * Fish identities come from the AI route (/api/pond/catch) with an
 * offline placeholder fallback; the game never breaks without the API.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { deposit, useWallet, withdraw } from "../shared/wallet";
import { fetchCatchIdentity, fetchWeatherHeadline } from "./api";
import { playBlip } from "./audio";
import { BaitIcon } from "./BaitIcon";
import { DexPanel } from "./DexPanel";
import { placeholderIdentity } from "./names";
import { downloadCatchCard } from "./photo";
import type { BaitId, PondSpot } from "./rarity";
import {
  REEL_SECONDS,
  rollRarity,
  rollSizeCm,
  rollVariant,
  sellPrice,
  ZONE_WIDTH,
  zoneCenterAt,
} from "./rarity";
import { SceneParticles } from "./SceneParticles";
import { BAITS, baitConfig, SPOTS, spotConfig, unlockedSpots } from "./spots";
import { FishSprite } from "./sprite/FishSprite";
import type { PondState } from "./storage";
import {
  emptyPondState,
  loadPondState,
  recordCatch,
  savePondState,
} from "./storage";
import type { CatchResult, GamePhase, Rarity } from "./types";
import { RARITY_LABEL } from "./types";

const BITE_WINDOW_MS = 900;
// After a result, the action button locks briefly so reel spam-taps
// can't instantly skip the catch card.
const CATCH_LOCK_MS = 1400;
const ESCAPE_LOCK_MS = 600;
/** Bobber flight time from rod tip to landing spot. */
const CAST_ARC_MS = 550;
/** How long a released fish takes to swim out of frame. */
const SWIM_OFF_MS = 1000;

const RARITY_COLOR: Record<Rarity, string> = {
  common: "#3b3b36",
  uncommon: "#1b6b2e",
  rare: "#3b6ea5",
  legendary: "#a5307a",
  anomaly: "#008080",
};

/** Sparkle positions around the catch card (rare and up). */
const SPARKLES = [
  { key: "a", left: "8%", top: "12%", delay: "0s" },
  { key: "b", left: "88%", top: "18%", delay: "0.25s" },
  { key: "c", left: "14%", top: "78%", delay: "0.5s" },
  { key: "d", left: "82%", top: "70%", delay: "0.75s" },
  { key: "e", left: "50%", top: "6%", delay: "1s" },
  { key: "f", left: "70%", top: "90%", delay: "1.25s" },
];

const ACTION_LABEL: Record<GamePhase, string> = {
  menu: "START GAME",
  idle: "CAST LINE",
  waiting: "WAITING...",
  bite: "HOOK IT!",
  reeling: "HOLD TO REEL",
  caught: "CAST AGAIN",
  escaped: "CAST AGAIN",
};

/**
 * Control chrome: modern and quiet (rounded, soft border, subtle
 * lift). Retro lives in the pixel art, not the buttons — per the
 * design note: "retro as accent, never as excuse".
 */
const BTN: React.CSSProperties = {
  background: "#f7f5ef",
  border: "1px solid #b8b3a6",
  borderRadius: 6,
  boxShadow: "inset 0 1px 0 #fff, 0 1px 2px rgba(0,0,0,0.12)",
  padding: "4px 12px",
  cursor: "pointer",
  color: "#2b2b27",
  fontWeight: 600,
};

/** Tab strip: the active tab joins the panel below it... */
const TAB_ACTIVE: React.CSSProperties = {
  ...BTN,
  background: "#fff",
  boxShadow: "none",
  borderRadius: "6px 6px 0 0",
  borderBottom: "1px solid #fff",
  fontWeight: 700,
  marginBottom: -1,
};

/**
 * ...inactive tabs sit back. borderBottom is explicit in BOTH tab
 * states so React never removes it while the `border` shorthand is
 * set (avoids a rerender warning).
 */
const TAB_IDLE: React.CSSProperties = {
  ...BTN,
  background: "#e9e6de",
  boxShadow: "none",
  borderRadius: "6px 6px 0 0",
  borderBottom: "1px solid #b8b3a6",
  color: "#5a564d",
  fontWeight: 600,
  marginBottom: -1,
};

interface ReelState {
  rarity: Rarity;
  behaviorSeed: number;
  needle: number; // 0..1, player-controlled
  velocity: number;
  progress: number; // 0..1, catch at 1
  elapsed: number;
  ticksInZone: number;
  ticksTotal: number;
}

export function PondGame() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [actionLocked, setActionLocked] = useState(false);
  const [weather, setWeather] = useState<string | null>(null);
  const [lastCatch, setLastCatch] = useState<CatchResult | null>(null);
  const lastCatchRef = useRef<CatchResult | null>(null);
  useEffect(() => {
    lastCatchRef.current = lastCatch;
  }, [lastCatch]);
  // Casting arc in flight (bobber flies in before it floats).
  const [castAnim, setCastAnim] = useState(false);
  // A just-released fish swimming off into the water.
  const [swimmer, setSwimmer] = useState<CatchResult | null>(null);
  const [view, setView] = useState<"game" | "dex">("game");
  const [ready, setReady] = useState(false);
  const [pond, setPond] = useState<PondState>(emptyPondState);
  const balance = useWallet();
  // Reel visuals mirrored into state for rendering.
  const [needle, setNeedle] = useState(0.5);
  const [zone, setZone] = useState({ center: 0.5, width: 0.3 });
  const [progress, setProgress] = useState(0.3);

  // Load persisted state once on mount; skip the intro for returners.
  useEffect(() => {
    const loaded = loadPondState();
    setPond(loaded);
    if (loaded.seenIntro) setPhase("idle");
    setReady(true);
  }, []);

  // Persist on every change after initial load.
  useEffect(() => {
    if (ready) savePondState(pond);
  }, [pond, ready]);

  const reelRef = useRef<ReelState | null>(null);
  const holdingRef = useRef(false);
  const phaseRef = useRef<GamePhase>("menu");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  // Mirror of pond state for callbacks that must not go stale.
  const pondRef = useRef(pond);
  useEffect(() => {
    pondRef.current = pond;
  }, [pond]);
  // The bait actually spent on the current cast.
  const castBaitRef = useRef<BaitId>("bare");
  /** Sound only when the player opted in (reads the live pond mirror). */
  const blip = useCallback((kind: Parameters<typeof playBlip>[0]) => {
    if (pondRef.current.sound) playBlip(kind);
  }, []);
  /**
   * Scene intro plates show once per spot per window instance: a spot
   * is marked "seen" on the first cast from it or when leaving it.
   */
  const [seenIntros, setSeenIntros] = useState<Set<PondSpot>>(() => new Set());
  const markIntroSeen = useCallback((spot: PondSpot) => {
    setSeenIntros((current) => {
      if (current.has(spot)) return current;
      const next = new Set(current);
      next.add(spot);
      return next;
    });
  }, []);
  const [unlockMsg, setUnlockMsg] = useState<string | null>(null);
  const prevSpeciesRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef(0);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // Milestone watcher: celebrate when a catch unlocks new waters.
  const speciesCount = Object.keys(pond.dex).length;
  /** Reel gauge: is the pull inside the safe tension window? */
  const inZone = Math.abs(needle - zone.center) <= zone.width / 2;
  /** The next locked spot, for the progress bar (null when all open). */
  const nextSpot = SPOTS.find((s) => s.milestone > speciesCount) ?? null;
  useEffect(() => {
    if (!ready) return;
    const prev = prevSpeciesRef.current;
    prevSpeciesRef.current = speciesCount;
    if (prev === null || speciesCount <= prev) return;
    const crossed = SPOTS.find(
      (s) => s.milestone > prev && s.milestone <= speciesCount,
    );
    if (!crossed) return;
    setUnlockMsg(`NEW WATERS UNLOCKED: ${crossed.label.toUpperCase()}`);
    const timer = window.setTimeout(() => setUnlockMsg(null), 4500);
    return () => window.clearTimeout(timer);
  }, [speciesCount, ready]);

  // Today's shared pond weather (one cheap fetch; fine if it fails).
  useEffect(() => {
    let cancelled = false;
    fetchWeatherHeadline().then((headline) => {
      if (!cancelled && headline) setWeather(headline);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const lockAction = useCallback((ms: number) => {
    setActionLocked(true);
    timersRef.current.push(window.setTimeout(() => setActionLocked(false), ms));
  }, []);

  const finishCatch = useCallback(
    (reel: ReelState) => {
      const reelScore =
        reel.ticksTotal > 0 ? reel.ticksInZone / reel.ticksTotal : 0;
      const seed = `pond:${Date.now()}:${Math.floor(Math.random() * 1e9)}`;
      const rarity = reel.rarity;
      const variant = rollVariant();
      const sizeCm = rollSizeCm(rarity, reelScore);
      const base: CatchResult = {
        seed,
        name: "???",
        flavor: "",
        rarity,
        variant,
        sizeCm,
        perfect: reelScore >= 0.85,
        pending: true,
      };
      setLastCatch(base);
      setPhase("caught");
      lockAction(CATCH_LOCK_MS);
      blip(
        rarity === "legendary" || rarity === "anomaly" || variant === "golden"
          ? "legendary"
          : "catch",
      );

      // Ask the AI route for the fish's identity; fall back to the
      // offline generator on any failure. The catch is ALWAYS recorded
      // and sold once resolved; the seed guard only protects the card
      // from being overwritten by a stale response.
      fetchCatchIdentity({
        rarity,
        spot: pondRef.current.spot,
        sizeCm,
        variant,
        bait: castBaitRef.current,
      }).then((identity) => {
        const offline = identity ?? placeholderIdentity(seed, rarity);
        const resolved: CatchResult = {
          ...base,
          name: offline.name,
          flavor: offline.flavor,
          hue: identity ? identity.hue : undefined,
          pending: false,
          soldFor: sellPrice(rarity, sizeCm, variant),
        };
        deposit(resolved.soldFor ?? 0);
        setPond((current) => recordCatch(current, resolved));
        setLastCatch((current) =>
          current && current.seed === seed ? resolved : current,
        );
      });
    },
    [lockAction, blip],
  );

  const startReel = useCallback(() => {
    reelRef.current = {
      rarity: rollRarity(pondRef.current.spot, castBaitRef.current),
      behaviorSeed: Math.floor(Math.random() * 1000),
      needle: 0.5,
      velocity: 0,
      progress: 0.3,
      elapsed: 0,
      ticksInZone: 0,
      ticksTotal: 0,
    };
    setPhase("reeling");

    let last = performance.now();
    const tick = (now: number) => {
      const reel = reelRef.current;
      if (!reel) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      reel.elapsed += dt;

      // Needle physics: hold to rise, release to sink. Forgiving damping.
      const accel = holdingRef.current ? 2.6 : -2.6;
      reel.velocity = (reel.velocity + accel * dt) * 0.92;
      reel.needle = Math.min(
        1,
        Math.max(0, reel.needle + reel.velocity * dt * 3),
      );

      const center = Math.min(
        0.92,
        Math.max(
          0.08,
          zoneCenterAt(reel.rarity, reel.elapsed, reel.behaviorSeed),
        ),
      );
      const width = ZONE_WIDTH[reel.rarity];
      const inZone = Math.abs(reel.needle - center) <= width / 2;

      reel.ticksTotal += 1;
      if (inZone) reel.ticksInZone += 1;
      // Progress climbs in-zone, drains gently outside, never below floor.
      reel.progress += inZone ? dt / (REEL_SECONDS * 0.72) : -dt * 0.05;
      reel.progress = Math.max(0.05, reel.progress);

      setNeedle(reel.needle);
      setZone({ center, width });
      setProgress(reel.progress);

      if (reel.progress >= 1) {
        finishCatch(reel);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [finishCatch]);

  const cast = useCallback(() => {
    // Spend bait at cast time; the cast keeps its bait even if the
    // selection changes mid-wait.
    const state = pondRef.current;
    const bait: BaitId =
      state.activeBait !== "bare" && state.baits[state.activeBait] > 0
        ? state.activeBait
        : "bare";
    castBaitRef.current = bait;
    setPond((current) => ({
      ...current,
      records: { ...current.records, casts: current.records.casts + 1 },
      baits:
        bait === "bare"
          ? current.baits
          : {
              ...current.baits,
              [bait]: Math.max(0, current.baits[bait] - 1),
            },
    }));
    setPhase("waiting");
    markIntroSeen(state.spot);
    // Casting arc: the bobber flies in from the rod tip, then lands.
    blip("cast");
    setCastAnim(true);
    timersRef.current.push(
      window.setTimeout(() => {
        setCastAnim(false);
        blip("splash");
      }, CAST_ARC_MS),
    );
    const waitMs = 1500 + Math.random() * 4500;
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase("bite");
        blip("bite");
        timersRef.current.push(
          window.setTimeout(() => {
            // Missed the reaction window: the fish escapes.
            if (phaseRef.current === "bite") {
              setPhase("escaped");
              blip("escape");
              lockAction(ESCAPE_LOCK_MS);
            }
          }, BITE_WINDOW_MS),
        );
      }, waitMs),
    );
  }, [lockAction, blip, markIntroSeen]);

  const hookIt = useCallback(() => {
    clearTimers();
    startReel();
  }, [clearTimers, startReel]);

  const reset = useCallback(() => {
    clearTimers();
    reelRef.current = null;
    setActionLocked(false); // belt-and-braces: never strand a lock
    setCastAnim(false);
    // Leaving the catch card: the fish swims off into the water.
    const caught = lastCatchRef.current;
    if (phaseRef.current === "caught" && caught && !caught.pending) {
      setSwimmer(caught);
      window.setTimeout(() => setSwimmer(null), SWIM_OFF_MS);
    }
    setPhase("idle");
  }, [clearTimers]);

  /** Spots can change while idle or from a result screen (implicit re-cast). */
  const canSwitchSpot =
    phase === "idle" || phase === "caught" || phase === "escaped";
  const switchSpot = useCallback(
    (spot: PondSpot) => {
      if (!canSwitchSpot) return;
      markIntroSeen(pondRef.current.spot);
      if (phaseRef.current !== "idle") reset(); // result screens -> idle
      setPond((current) => ({ ...current, spot }));
    },
    [canSwitchSpot, markIntroSeen, reset],
  );

  /** Buy a stack of bait with JoshBucks; no-op when funds are short. */
  const buyBait = useCallback(
    (id: Exclude<BaitId, "bare">) => {
      const cfg = baitConfig(id);
      if (!withdraw(cfg.price)) return;
      blip("buy");
      setPond((current) => ({
        ...current,
        baits: { ...current.baits, [id]: current.baits[id] + cfg.stack },
      }));
    },
    [blip],
  );

  // SPACE is the universal key: cast, hook, and reel by phase.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (phase === "reeling") {
        holdingRef.current = true;
        return;
      }
      if (e.repeat) return; // discrete actions fire once per press
      if (actionLocked) return; // catch-card lock eats stray presses
      if (phase === "idle") cast();
      else if (phase === "bite") hookIt();
      else if (phase === "caught" || phase === "escaped") reset();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") holdingRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      holdingRef.current = false;
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, actionLocked, cast, hookIt, reset]);

  // Safety net: releasing anywhere (or losing window focus) stops reeling.
  useEffect(() => {
    if (phase !== "reeling") return;
    const release = () => {
      holdingRef.current = false;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("blur", release);
    };
  }, [phase]);

  /** The one big button: mouse and touch both drive the whole game here. */
  const actionDown = useCallback(() => {
    if (actionLocked) return; // catch-card lock eats stray taps
    if (phase === "menu") {
      setPond((current) => ({ ...current, seenIntro: true }));
      setPhase("idle");
    } else if (phase === "idle") cast();
    else if (phase === "bite") {
      hookIt();
      holdingRef.current = true; // keep holding straight into the reel
    } else if (phase === "reeling") holdingRef.current = true;
    else if (phase === "caught" || phase === "escaped") reset();
  }, [phase, actionLocked, cast, hookIt, reset]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        height: "100%",
        touchAction: "manipulation",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {!ready ? null : (
        <>
          {/* Tab strip: game + collection, styled like a retro dialog */}
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
            <button
              type="button"
              onClick={() => setView("game")}
              style={view === "game" ? TAB_ACTIVE : TAB_IDLE}
            >
              POND
            </button>
            <button
              type="button"
              onClick={() => setView("dex")}
              style={view === "dex" ? TAB_ACTIVE : TAB_IDLE}
              title="Your fish collection"
            >
              FISHDEX ({Object.keys(pond.dex).length})
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !pond.sound;
                setPond((current) => ({ ...current, sound: next }));
                if (next) playBlip("buy"); // confirm, and unlock audio on the gesture
              }}
              title={
                pond.sound
                  ? "Sound on (click to mute)"
                  : "Sound off (click to enable)"
              }
              aria-pressed={pond.sound}
              style={{ ...BTN, marginLeft: "auto", padding: "4px 8px" }}
            >
              {pond.sound ? "🔊" : "🔇"}
            </button>
            {view === "game" && phase === "idle" && (
              <button
                type="button"
                onClick={() => setPhase("menu")}
                title="Instructions"
                style={{ ...BTN, padding: "4px 10px" }}
              >
                ?
              </button>
            )}
          </div>
          {view === "dex" ? (
            <DexPanel dex={pond.dex} records={pond.records} />
          ) : (
            <>
              {/* Spot strip: milestone-locked waters */}
              <div style={{ display: "flex", gap: 2 }}>
                {SPOTS.map((s) => {
                  const unlocked = unlockedSpots(speciesCount).includes(s.id);
                  const active = pond.spot === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      // Switchable while idle OR on a result screen — a new
                      // scene implies "cast again", so no extra click.
                      disabled={!unlocked || !canSwitchSpot}
                      onClick={() => switchSpot(s.id)}
                      title={
                        unlocked ? s.label : `Unlocks at ${s.milestone} species`
                      }
                      style={{
                        ...BTN,
                        fontSize: 12,
                        fontWeight: active ? 700 : 400,
                        background: active ? "#f4f1ea" : "#cfccc2",
                        opacity: unlocked ? 1 : 0.55,
                        cursor: unlocked ? "pointer" : "not-allowed",
                      }}
                    >
                      {unlocked ? s.label : `🔒 ${s.milestone}`}
                    </button>
                  );
                })}
              </div>
              {/* Scene: each spot has its own light */}
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  minHeight: 220,
                  overflow: "hidden",
                  border: "2px inset #808080",
                  background: spotConfig(pond.spot).scene.background,
                  // Generated scene art is JPEG scaled to ~1/3: smooth
                  // sampling (not pixelated) avoids compression speckle.
                }}
              >
                {/* Atmosphere: pollen, drips, data bits, sinking debris */}
                <SceneParticles spot={pond.spot} />
                {/* Casting arc: bobber flies in from the rod tip */}
                {phase === "waiting" && castAnim && (
                  <div className="pond-cast" aria-hidden />
                )}
                {/* Fishing line, bobber, ripples */}
                {((phase === "waiting" && !castAnim) || phase === "bite") && (
                  <>
                    <svg
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                      }}
                    >
                      <title>Fishing line</title>
                      {/* From the rod tip (off the top-right edge) to the bobber */}
                      <line
                        x1="98%"
                        y1="4%"
                        x2="47.6%"
                        y2="40%"
                        stroke="rgba(30,30,30,0.55)"
                        strokeWidth="1"
                      />
                    </svg>
                    {/* Ripples spread from where the bobber meets the water */}
                    <span
                      className="pond-ripple pond-splash"
                      style={{
                        left: "calc(46% + 10px)",
                        top: "calc(38% + 14px)",
                      }}
                    />
                    <span
                      className={
                        phase === "bite"
                          ? "pond-ripple"
                          : "pond-ripple pond-ripple--idle"
                      }
                      style={{
                        left: "calc(46% + 10px)",
                        top: "calc(38% + 14px)",
                      }}
                    />
                    {phase === "bite" && (
                      <span
                        className="pond-ripple pond-ripple--2"
                        style={{
                          left: "calc(46% + 10px)",
                          top: "calc(38% + 14px)",
                        }}
                      />
                    )}
                    <div
                      className={
                        phase === "bite"
                          ? "pond-bobber pond-bobber--bite"
                          : "pond-bobber"
                      }
                      style={{
                        position: "absolute",
                        left: "46%",
                        top: "38%",
                        width: 20,
                        height: 20,
                        background:
                          "linear-gradient(#d33 0 50%, #fff 50% 100%)",
                        border: "2px solid #3b3b36",
                      }}
                    />
                  </>
                )}
                {phase === "bite" && (
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "18%",
                      fontSize: 48,
                      fontWeight: 700,
                      color: "#d33",
                      textShadow: "2px 2px #3b3b36",
                    }}
                  >
                    !
                  </div>
                )}

                {phase === "menu" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 8,
                      background: "#f4f1ea",
                      border: "2px outset #fff",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      textAlign: "center",
                      padding: 12,
                    }}
                  >
                    <strong style={{ fontSize: 22, letterSpacing: 1 }}>
                      POND.EXE
                    </strong>
                    <div
                      style={{
                        fontSize: 12,
                        maxWidth: 360,
                        textAlign: "left",
                        lineHeight: 1.6,
                      }}
                    >
                      <div>
                        The big button below does everything. On a keyboard,
                        SPACE works too.
                      </div>
                      <div>1. CAST — tap the button.</div>
                      <div>
                        2. HOOK — when the{" "}
                        <span style={{ color: "#d33", fontWeight: 700 }}>
                          !
                        </span>{" "}
                        appears, tap again fast or the fish escapes.
                      </div>
                      <div>
                        3. REEL — HOLD the button to lift the needle, release to
                        drop it. Keep it inside the green zone to fill the reel
                        bar.
                      </div>
                      <div>4. Golden fish exist. Good luck.</div>
                    </div>
                  </div>
                )}
                {phase === "idle" && !seenIntros.has(pond.spot) && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      color: spotConfig(pond.spot).scene.text,
                      textShadow: spotConfig(pond.spot).scene.textShadow,
                    }}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        // Legibility over the scene art: a soft dark plate.
                        background: "rgba(10, 14, 20, 0.42)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        padding: "8px 14px",
                        maxWidth: "80%",
                        color: "#f4f1ea",
                        textShadow: "1px 1px rgba(0,0,0,0.6)",
                      }}
                    >
                      <div>{spotConfig(pond.spot).idleLine}</div>
                      {weather && (
                        <div
                          style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}
                        >
                          Today: {weather}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {phase === "escaped" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      color: spotConfig(pond.spot).scene.text,
                      textShadow: spotConfig(pond.spot).scene.textShadow,
                    }}
                  >
                    It got away. The pond remembers nothing.
                  </div>
                )}
                {unlockMsg && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#f4f1ea",
                      border: "2px outset #fff",
                      padding: "4px 12px",
                      fontWeight: 700,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {unlockMsg}
                  </div>
                )}
                {/* A released fish darts off into the water */}
                {swimmer && (
                  <div
                    className="pond-swim-off"
                    style={{ position: "absolute", left: "38%", top: "46%" }}
                    aria-hidden
                  >
                    <FishSprite
                      seed={swimmer.seed}
                      variant={swimmer.variant}
                      hueOverride={swimmer.hue}
                      scale={3}
                    />
                  </div>
                )}
                {phase === "caught" && lastCatch && (
                  <div
                    className={
                      lastCatch.pending
                        ? undefined
                        : `pond-card pond-card--${lastCatch.rarity}`
                    }
                    style={{
                      position: "absolute",
                      inset: 8,
                      background: "#f4f1ea",
                      border: `3px solid ${
                        lastCatch.pending
                          ? "#fff"
                          : RARITY_COLOR[lastCatch.rarity]
                      }`,
                      borderRadius: 6,
                      boxShadow: lastCatch.pending
                        ? "none"
                        : `0 0 0 2px #fff, 0 0 22px ${RARITY_COLOR[lastCatch.rarity]}88`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      textAlign: "center",
                      overflow: "hidden",
                    }}
                  >
                    {!lastCatch.pending &&
                      (lastCatch.rarity === "rare" ||
                        lastCatch.rarity === "legendary" ||
                        lastCatch.rarity === "anomaly") &&
                      SPARKLES.map((s) => (
                        <span
                          key={s.key}
                          className="pond-sparkle"
                          style={{
                            left: s.left,
                            top: s.top,
                            animationDelay: s.delay,
                            background: RARITY_COLOR[lastCatch.rarity],
                          }}
                        />
                      ))}
                    {!lastCatch.pending && lastCatch.variant === "golden" && (
                      <span className="pond-shimmer" aria-hidden />
                    )}
                    {lastCatch.pending ? (
                      <div style={{ fontSize: 14, padding: 24 }}>
                        Reeling in the details...
                      </div>
                    ) : (
                      <>
                        <FishSprite
                          seed={lastCatch.seed}
                          variant={lastCatch.variant}
                          hueOverride={lastCatch.hue}
                          scale={5}
                        />
                        <strong style={{ fontSize: 15 }}>
                          {lastCatch.name}
                        </strong>
                        <span
                          style={{
                            color: RARITY_COLOR[lastCatch.rarity],
                            fontWeight: 700,
                          }}
                        >
                          {RARITY_LABEL[lastCatch.rarity]}
                          {lastCatch.variant === "golden" ? " ★ GOLDEN" : ""}
                          {lastCatch.perfect ? " • Perfect catch!" : ""}
                        </span>
                        <span>{lastCatch.sizeCm} cm</span>
                        <em style={{ maxWidth: 320 }}>{lastCatch.flavor}</em>
                        {lastCatch.soldFor !== undefined && (
                          <span style={{ fontWeight: 700, color: "#1b6b2e" }}>
                            Sold for J${lastCatch.soldFor}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => downloadCatchCard(lastCatch)}
                          title="Download a photo card of this catch"
                          style={{
                            ...BTN,
                            marginTop: 4,
                            fontSize: 11,
                            padding: "3px 10px",
                          }}
                        >
                          📸 Share catch
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Reel meter */}
              {phase === "reeling" && (
                <div
                  onPointerDown={() => {
                    holdingRef.current = true;
                  }}
                  onPointerUp={() => {
                    holdingRef.current = false;
                  }}
                  onPointerLeave={() => {
                    holdingRef.current = false;
                  }}
                  style={{
                    userSelect: "none",
                    touchAction: "none",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      color: inZone ? "#1b6b2e" : "#b02a2a",
                      marginBottom: 3,
                    }}
                  >
                    <span>LINE TENSION</span>
                    <span>{inZone ? "HOLDING" : "SLIPPING"}</span>
                  </div>
                  {/* The gauge: a fishing line under load. The green band is
                      the safe tension window; the marker is your pull. */}
                  <div
                    className={inZone ? undefined : "pond-gauge--strain"}
                    style={{
                      position: "relative",
                      height: 28,
                      borderRadius: 6,
                      border: "1px solid #b8b3a6",
                      background:
                        "linear-gradient(90deg, #bfe3c7 0%, #e7e2cf 45%, #f2c1b0 100%)",
                      boxShadow: inZone
                        ? "inset 0 1px 2px rgba(0,0,0,0.15)"
                        : "inset 0 1px 2px rgba(0,0,0,0.15), 0 0 10px rgba(211,51,51,0.45)",
                      overflow: "hidden",
                    }}
                  >
                    {/* The line itself, taut across the gauge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        right: 0,
                        height: 2,
                        background: inZone ? "#2b2b27" : "#b02a2a",
                        opacity: 0.55,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: `${(zone.center - zone.width / 2) * 100}%`,
                        width: `${zone.width * 100}%`,
                        background: "rgba(43, 158, 68, 0.35)",
                        borderLeft: "2px solid #1b6b2e",
                        borderRight: "2px solid #1b6b2e",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 3,
                        bottom: 3,
                        left: `calc(${needle * 100}% - 4px)`,
                        width: 8,
                        borderRadius: 3,
                        background: inZone ? "#1b6b2e" : "#b02a2a",
                        boxShadow: "0 0 0 2px #fff",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#3b6ea5",
                      marginTop: 6,
                      marginBottom: 3,
                    }}
                  >
                    <span>HAULING IN</span>
                    <span>{Math.round(progress * 100)}%</span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 5,
                      border: "1px solid #b8b3a6",
                      background: "#fff",
                      overflow: "hidden",
                    }}
                  >
                    {/* scaleX (not a % width): exact per frame at 60fps,
                        no layout, nothing for a transition to fight. */}
                    <div
                      style={{
                        height: "100%",
                        width: "100%",
                        transformOrigin: "left center",
                        transform: `scaleX(${Math.min(1, Math.max(0, progress))})`,
                        background: "linear-gradient(90deg, #6aa5dc, #3b6ea5)",
                        willChange: "transform",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4, color: "#555" }}>
                    Hold the button below (or SPACE) to keep the line in the
                    green.
                  </div>
                </div>
              )}

              {/* Tackle box: bait chips + buy, and progress to new waters */}
              <div
                style={{
                  border: "1px solid #b8b3a6",
                  borderRadius: 8,
                  background: "#fbfaf6",
                  padding: "6px 8px",
                  fontSize: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {BAITS.map((b) => {
                    const active = pond.activeBait === b.id;
                    const count = b.id === "bare" ? null : pond.baits[b.id];
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setPond((current) => ({
                            ...current,
                            activeBait: b.id,
                          }))
                        }
                        title={`${b.label} — ${b.blurb}`}
                        style={{
                          ...BTN,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 8px",
                          fontSize: 12,
                          background: active ? "#e3efff" : "#f7f5ef",
                          borderColor: active ? "#3b6ea5" : "#b8b3a6",
                          boxShadow: active
                            ? "0 0 0 2px rgba(59,110,165,0.25)"
                            : BTN.boxShadow,
                        }}
                      >
                        <BaitIcon id={b.id} />
                        <span>{b.label}</span>
                        <span
                          style={{
                            color: "#5a564d",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {count === null ? "∞" : count}
                        </span>
                      </button>
                    );
                  })}
                  {pond.activeBait !== "bare" && (
                    <button
                      type="button"
                      onClick={() =>
                        buyBait(pond.activeBait as Exclude<BaitId, "bare">)
                      }
                      disabled={balance < baitConfig(pond.activeBait).price}
                      style={{
                        ...BTN,
                        marginLeft: "auto",
                        fontSize: 12,
                        background: "#1b6b2e",
                        color: "#fff",
                        borderColor: "#155424",
                        opacity:
                          balance < baitConfig(pond.activeBait).price ? 0.5 : 1,
                      }}
                    >
                      + {baitConfig(pond.activeBait).stack} for J$
                      {baitConfig(pond.activeBait).price}
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#5a564d",
                  }}
                >
                  <span style={{ whiteSpace: "nowrap" }}>
                    {nextSpot
                      ? `Next waters: ${nextSpot.label}`
                      : "All waters unlocked"}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      background: "#e6e3da",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: nextSpot
                          ? `${Math.min(100, (speciesCount / nextSpot.milestone) * 100)}%`
                          : "100%",
                        background: "linear-gradient(90deg, #7bd88f, #1b6b2e)",
                        transition: "width 400ms ease-out",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {nextSpot
                      ? `${speciesCount}/${nextSpot.milestone} species`
                      : `${speciesCount} species`}
                  </span>
                </div>
              </div>
              {/* One big action button: mouse and touch, always the same spot. */}
              <button
                type="button"
                disabled={phase === "waiting" || actionLocked}
                onContextMenu={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  actionDown();
                }}
                onPointerUp={() => {
                  holdingRef.current = false;
                }}
                onPointerLeave={() => {
                  holdingRef.current = false;
                }}
                onPointerCancel={() => {
                  holdingRef.current = false;
                }}
                style={{
                  ...BTN,
                  height: 48,
                  fontWeight: 700,
                  fontSize: 15,
                  touchAction: "none",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >
                {actionLocked
                  ? phase === "caught"
                    ? "GOT ONE!"
                    : "IT GOT AWAY..."
                  : ACTION_LABEL[phase]}
              </button>
              <div
                style={{ display: "flex", alignItems: "center", fontSize: 12 }}
              >
                <span>Tip: pressing SPACE presses the button.</span>
                <span style={{ marginLeft: "auto" }}>
                  J${balance.toLocaleString()} | Casts: {pond.records.casts} |
                  Catches: {pond.records.catches}
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
