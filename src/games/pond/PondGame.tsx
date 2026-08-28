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
import { DexPanel } from "./DexPanel";
import { placeholderIdentity } from "./names";
import type { BaitId } from "./rarity";
import {
  REEL_SECONDS,
  rollRarity,
  rollSizeCm,
  rollVariant,
  sellPrice,
  ZONE_WIDTH,
  zoneCenterAt,
} from "./rarity";
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

const RARITY_COLOR: Record<Rarity, string> = {
  common: "#3b3b36",
  uncommon: "#1b6b2e",
  rare: "#3b6ea5",
  legendary: "#a5307a",
  anomaly: "#008080",
};

const ACTION_LABEL: Record<GamePhase, string> = {
  menu: "START GAME",
  idle: "CAST LINE",
  waiting: "WAITING...",
  bite: "HOOK IT!",
  reeling: "HOLD TO REEL",
  caught: "CAST AGAIN",
  escaped: "CAST AGAIN",
};

/** Win95 button chrome (Tailwind preflight strips native borders). */
const BTN: React.CSSProperties = {
  background: "#e6e3da",
  border: "2px outset #fbfaf6",
  padding: "2px 10px",
  cursor: "pointer",
  color: "#2b2b27",
};

/** Retro tab strip: the active tab is raised and bright... */
const TAB_ACTIVE: React.CSSProperties = {
  ...BTN,
  background: "#f4f1ea",
  fontWeight: 700,
  borderBottom: "2px solid #f4f1ea",
};

/**
 * ...inactive tabs sit dimmer and a pixel lower, asking to be clicked.
 * borderBottom is explicit in BOTH tab states so React never removes
 * it while the `border` shorthand is set (avoids a rerender warning).
 */
const TAB_IDLE: React.CSSProperties = {
  ...BTN,
  background: "#cfccc2",
  transform: "translateY(2px)",
  borderBottom: "2px outset #fbfaf6",
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
    [lockAction],
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
    const waitMs = 1500 + Math.random() * 4500;
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase("bite");
        timersRef.current.push(
          window.setTimeout(() => {
            // Missed the reaction window: the fish escapes.
            if (phaseRef.current === "bite") {
              setPhase("escaped");
              lockAction(ESCAPE_LOCK_MS);
            }
          }, BITE_WINDOW_MS),
        );
      }, waitMs),
    );
  }, [lockAction]);

  const hookIt = useCallback(() => {
    clearTimers();
    startReel();
  }, [clearTimers, startReel]);

  const reset = useCallback(() => {
    clearTimers();
    reelRef.current = null;
    setActionLocked(false); // belt-and-braces: never strand a lock
    setPhase("idle");
  }, [clearTimers]);

  /** Buy a stack of bait with JoshBucks; no-op when funds are short. */
  const buyBait = useCallback((id: Exclude<BaitId, "bare">) => {
    const cfg = baitConfig(id);
    if (!withdraw(cfg.price)) return;
    setPond((current) => ({
      ...current,
      baits: { ...current.baits, [id]: current.baits[id] + cfg.stack },
    }));
  }, []);

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
            {view === "game" && phase === "idle" && (
              <button
                type="button"
                onClick={() => setPhase("menu")}
                title="Instructions"
                style={{ ...BTN, marginLeft: "auto" }}
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
                      disabled={!unlocked || phase !== "idle"}
                      onClick={() =>
                        setPond((current) => ({ ...current, spot: s.id }))
                      }
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
                  imageRendering: "pixelated",
                }}
              >
                {/* Bobber */}
                {(phase === "waiting" || phase === "bite") && (
                  <div
                    style={{
                      position: "absolute",
                      left: "46%",
                      top: phase === "bite" ? "44%" : "38%",
                      width: 20,
                      height: 20,
                      background: "linear-gradient(#d33 0 50%, #fff 50% 100%)",
                      border: "2px solid #3b3b36",
                      transition: "top 120ms",
                    }}
                  />
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
                {phase === "idle" && (
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
                    <div style={{ textAlign: "center" }}>
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
                {phase === "caught" && lastCatch && (
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
                      gap: 4,
                      textAlign: "center",
                    }}
                  >
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
                      position: "relative",
                      height: 26,
                      border: "2px inset #808080",
                      background: "#cfd8dc",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: `${(zone.center - zone.width / 2) * 100}%`,
                        width: `${zone.width * 100}%`,
                        background: "#7bd88f",
                        border: "1px solid #1b6b2e",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: -2,
                        bottom: -2,
                        left: `calc(${needle * 100}% - 3px)`,
                        width: 6,
                        background: "#3b3b36",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      height: 10,
                      border: "2px inset #808080",
                      marginTop: 4,
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress * 100}%`,
                        background: "#3b6ea5",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    Hold the button below (or SPACE) to lift the needle.
                  </div>
                </div>
              )}

              {/* Bait shop row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <span>Bait:</span>
                <select
                  value={pond.activeBait}
                  onChange={(e) =>
                    setPond((current) => ({
                      ...current,
                      activeBait: e.target.value as BaitId,
                    }))
                  }
                  style={{ ...BTN, padding: "2px 4px" }}
                >
                  {BAITS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id === "bare"
                        ? `${b.label} (∞)`
                        : `${b.label} (${pond.baits[b.id]})`}
                    </option>
                  ))}
                </select>
                {pond.activeBait !== "bare" && (
                  <button
                    type="button"
                    onClick={() =>
                      buyBait(pond.activeBait as Exclude<BaitId, "bare">)
                    }
                    disabled={balance < baitConfig(pond.activeBait).price}
                    style={{
                      ...BTN,
                      fontSize: 12,
                      opacity:
                        balance < baitConfig(pond.activeBait).price ? 0.55 : 1,
                    }}
                  >
                    Buy {baitConfig(pond.activeBait).stack} · J$
                    {baitConfig(pond.activeBait).price}
                  </button>
                )}
                <span style={{ marginLeft: "auto", color: "#555" }}>
                  {baitConfig(pond.activeBait).blurb}
                </span>
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
