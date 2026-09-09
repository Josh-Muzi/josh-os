"use client";

/**
 * DERBY.EXE — standalone on-demand races.
 * Every race is dealt fresh when the player is ready: bet (or don't),
 * hit START, watch the AI-announced replay, collect, and a new field
 * arrives after a 10-second cooldown. AI races come from the server;
 * if it's unreachable the game deals local pool races instead
 * ("offline exhibition") with the identical flow.
 *
 * Clock rule: all race timing uses Date.now() deltas — never rAF
 * timestamps, never performance.now() (hard-won lesson).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { deposit, useWallet, withdraw } from "../shared/wallet";
import type { CommentaryBeat, FreshRace } from "./api";
import { fetchFreshRace } from "./api";
import type { StoredBet } from "./betStore";
import { loadBet, saveBet } from "./betStore";
import { generateLocalCard } from "./localCard";
import { priceRace } from "./odds";
import { simulateRace, TICKS_PER_SECOND, TRACK_LENGTH } from "./sim";
import { HorseSprite } from "./sprite/HorseSprite";
import type { DerbyState } from "./storage";
import {
  emptyDerbyState,
  loadDerbyState,
  recordResult,
  recordShark,
  saveDerbyState,
} from "./storage";
import trackArt from "./track.png";
import { TRAITS } from "./traits";
import type { RaceCard, SimResult } from "./types";
import { SHARK_BAILOUT, SHARK_THRESHOLD, VincentDialog } from "./Vincent";

type UiPhase = "loading" | "betting" | "racing" | "results";

const NEXT_RACE_BUFFER_SEC = 10;
/** Minimum spacing between announcer lines (ms). */
const TICKER_GAP_MS = 1100;

/**
 * Track art geometry, measured from track.png (1536x1024) and expressed
 * as % of the image so the overlay scales with the window. Lanes are
 * six even bands (rails at y=365..852); the finish checker sits at
 * x=1252; the starting gate ends around x=165.
 */
const TRACK = {
  laneTopPct: (365 / 1024) * 100,
  laneHeightPct: (81.17 / 1024) * 100,
  gateExitPct: 11,
  finishPct: 81.5,
  /** Tote board black panel (we draw the REAL odds over the baked ones). */
  tote: { left: 32, top: 4.5, width: 36, height: 10 },
  /** Bands for the motion overlays (crowd bob, bunting wave). */
  crowdBand: { top: 20, bottom: 29 },
  buntingBand: { top: 16.5, bottom: 20 },
  /** The FINISH pole column (x≈1240-1300) — motion overlays skip it. */
  pole: { left: 80, right: 85 },
};

/**
 * A moving copy of the track art clipped to one horizontal band,
 * split into a left and right piece so the FINISH pole (which passes
 * through the crowd/bunting bands) never moves with them.
 */
function ArtBand({
  className,
  top,
  bottom,
}: {
  className: string;
  top: number;
  bottom: number;
}) {
  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: `url(${trackArt.src})`,
    backgroundSize: "100% 100%",
    imageRendering: "pixelated",
  };
  return (
    <>
      <div
        className={className}
        style={{
          ...base,
          clipPath: `inset(${top}% ${100 - TRACK.pole.left}% ${100 - bottom}% 0)`,
        }}
      />
      <div
        className={className}
        style={{
          ...base,
          clipPath: `inset(${top}% 0 ${100 - bottom}% ${TRACK.pole.right}%)`,
        }}
      />
    </>
  );
}

/** Win95 chrome, matching POND's controls. */
const BTN: React.CSSProperties = {
  background: "#e6e3da",
  border: "2px outset #fbfaf6",
  padding: "2px 10px",
  cursor: "pointer",
  color: "#2b2b27",
};

const EVENT_LINE: Record<string, (name: string) => string> = {
  stall: (n) => `${n} has stopped. No reason given.`,
  burst: (n) => `${n} finds another gear!`,
  wrongway: (n) => `${n} is going the WRONG WAY.`,
  nap: (n) => `${n} is taking a nap. Mid-race.`,
  overtake: (n) => `${n} takes the lead!`,
  finish: (n) => `${n} crosses the line!`,
};

interface SimBundle {
  sim: SimResult;
  frames: number[][];
}

function prepareSim(card: RaceCard, seed: string): SimBundle {
  const sim = simulateRace(card, seed, {
    collectFrames: true,
    logOvertakes: true,
  });
  return { sim, frames: sim.frames ?? [] };
}

/**
 * Resolve a stored bet from a previous visit. A race that was STARTED
 * settles deterministically (the result was always decided); a bet
 * whose race never ran is refunded in full (Josh's rule).
 */
function resolveStoredBet(bet: StoredBet): {
  refunded: boolean;
  winnings: number;
} {
  if (!bet.started) {
    deposit(bet.amount);
    saveBet({ ...bet, settled: true });
    return { refunded: true, winnings: 0 };
  }
  const sim = simulateRace(bet.card, bet.seed);
  const won = sim.finishOrder[0] === bet.racer;
  const winnings = won ? Math.round(bet.amount * bet.decimal) : 0;
  if (won) deposit(winnings);
  saveBet({ ...bet, settled: true });
  return { refunded: false, winnings };
}

export function DerbyGame() {
  const balance = useWallet();
  const [phase, setPhase] = useState<UiPhase>("loading");
  const [raceNumber, setRaceNumber] = useState(1);
  const [race, setRace] = useState<FreshRace | null>(null);
  const [isLive, setIsLive] = useState(true); // false = offline exhibition
  const [pick, setPick] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("50");
  const [betPlaced, setBetPlaced] = useState<StoredBet | null>(null);
  const [positions, setPositions] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [ticker, setTicker] = useState<Array<{ id: number; text: string }>>([]);
  const [payout, setPayout] = useState<number | null>(null);
  const [nextIn, setNextIn] = useState(NEXT_RACE_BUFFER_SEC);
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);
  const [derby, setDerby] = useState<DerbyState>(emptyDerbyState);
  const [derbyReady, setDerbyReady] = useState(false);
  const [view, setView] = useState<"track" | "records">("track");
  const [sharkOpen, setSharkOpen] = useState(false);
  const sharkDismissedSeedRef = useRef<string | null>(null);
  // Track art scales with the window; horses pick the crisp integer
  // scale (1/8 or 1/4 of the sheet cell) that fits the lane height.
  // Callback ref: the track div mounts/unmounts with the phase.
  const [horseScale, setHorseScale] = useState<0.5 | 1>(0.5);
  const trackObserverRef = useRef<ResizeObserver | null>(null);
  const trackRef = useCallback((el: HTMLDivElement | null) => {
    trackObserverRef.current?.disconnect();
    trackObserverRef.current = null;
    if (!el) return;
    const measure = () => {
      const laneHeightPx = (el.clientWidth * 81.17) / 1536;
      setHorseScale(laneHeightPx >= 52 ? 1 : 0.5);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    trackObserverRef.current = observer;
  }, []);
  const [flash, setFlash] = useState(false);
  const flashedSeedRef = useRef<string | null>(null);
  // Previous frame's positions, so dust only appears when a horse is
  // actually moving (a napping horse shouldn't kick up dirt).
  const prevPositionsRef = useRef<number[]>([0, 0, 0, 0, 0, 0]);
  const movingNow = positions.map(
    (pos, i) => phase === "racing" && pos - prevPositionsRef.current[i] > 0.02,
  );
  useEffect(() => {
    prevPositionsRef.current = positions;
  }, [positions]);

  // Persisted derby state (history, records, Vincent's ledger).
  useEffect(() => {
    setDerby(loadDerbyState());
    setDerbyReady(true);
  }, []);
  useEffect(() => {
    if (derbyReady) saveDerbyState(derby);
  }, [derby, derbyReady]);

  const simBundleRef = useRef<SimBundle | null>(null);
  const raceStartAtRef = useRef(0);
  const rafRef = useRef(0);
  const tickerIdRef = useRef(0);
  const settledSeedRef = useRef<string | null>(null);
  const betRef = useRef<StoredBet | null>(null);
  // The NEXT race generates in the background while this one plays,
  // so the cooldown deals instantly and AI latency stays invisible.
  const prefetchRef = useRef<Promise<FreshRace | null> | null>(null);
  useEffect(() => {
    betRef.current = betPlaced;
  }, [betPlaced]);

  /** Deal a fresh race: AI first, local pool cards when offline. */
  const dealRace = useCallback(async () => {
    setPhase("loading");
    setPick(null);
    setBetPlaced(null);
    setPayout(null);
    setTicker([]);
    setPositions([0, 0, 0, 0, 0, 0]);
    simBundleRef.current = null;
    const pending = prefetchRef.current ?? fetchFreshRace();
    prefetchRef.current = null;
    const fresh = await pending;
    if (fresh) {
      setRace(fresh);
      setIsLive(true);
    } else {
      console.warn("DERBY: track feed unavailable, dealing local cards.");
      const seed = `local:${Date.now()}:${Math.floor(Math.random() * 1e6)}`;
      const card = generateLocalCard(seed);
      setRace({ seed, card, odds: priceRace(card, seed), commentary: null });
      setIsLive(false);
    }
    setPhase("betting");
  }, []);

  // Mount: settle any interrupted bet (the sim is deterministic, so
  // the result was always decided), then deal the first race. The
  // guard keeps StrictMode's dev double-mount from dealing twice
  // (each deal is a paid generation).
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    const stored = loadBet();
    if (stored && !stored.settled) {
      const result = resolveStoredBet(stored);
      const name = stored.card.racers[stored.racer]?.name ?? "Your racer";
      setWelcomeBack(
        result.refunded
          ? `Your J$${stored.amount.toLocaleString()} on ${name} was refunded — that race never ran.`
          : result.winnings > 0
            ? `While you were away: ${name} WON. +J$${result.winnings.toLocaleString()} collected.`
            : `While you were away: ${name} did not win. The track keeps the money.`,
      );
    }
    void dealRace();
  }, [dealRace]);

  // Closing the window with an unstarted bet refunds it immediately
  // (no waiting for the next visit).
  useEffect(
    () => () => {
      const bet = betRef.current;
      if (bet && !bet.started && !bet.settled) {
        deposit(bet.amount);
        saveBet({ ...bet, settled: true });
      }
    },
    [],
  );

  const placeBet = useCallback(() => {
    if (pick === null || !race || !race.odds[pick]) return;
    const amount = Math.floor(Number(betAmount));
    if (!Number.isFinite(amount) || amount < 1) return;
    if (!withdraw(amount)) return;
    const bet: StoredBet = {
      seed: race.seed,
      card: race.card,
      racer: pick,
      amount,
      decimal: race.odds[pick].decimal,
      started: false,
      settled: false,
    };
    setBetPlaced(bet);
    saveBet(bet);
  }, [pick, betAmount, race]);

  const startRace = useCallback(() => {
    if (!race) return;
    simBundleRef.current = prepareSim(race.card, race.seed);
    raceStartAtRef.current = Date.now();
    setWelcomeBack(null);
    setSharkOpen(false);
    // The bet is now committed: a started race always settles.
    const bet = betRef.current;
    if (bet && !bet.started) {
      const started = { ...bet, started: true };
      setBetPlaced(started);
      saveBet(started);
    }
    setPhase("racing");
    // Warm up the next field now — only players who actually race
    // trigger the (paid) generation of the following one.
    if (!prefetchRef.current) prefetchRef.current = fetchFreshRace();
  }, [race]);

  // Vincent appears, uninvited, when you can't make a meaningful bet:
  // once per race, dismissable, only at the betting window.
  useEffect(() => {
    if (!derbyReady || phase !== "betting" || !race || betPlaced) return;
    if (balance >= SHARK_THRESHOLD) return;
    if (derby.shark.lastSeed === race.seed) return;
    if (sharkDismissedSeedRef.current === race.seed) return;
    setSharkOpen(true);
  }, [derbyReady, phase, race, betPlaced, balance, derby.shark.lastSeed]);

  const acceptShark = useCallback(() => {
    if (!race) return;
    deposit(SHARK_BAILOUT);
    setDerby((current) => recordShark(current, race.seed));
    setSharkOpen(false);
  }, [race]);

  const dismissShark = useCallback(() => {
    if (race) sharkDismissedSeedRef.current = race.seed;
    setSharkOpen(false);
  }, [race]);

  // The replay renderer: positions lerp between sim ticks; ticker
  // lines come from AI commentary beats when present, canned lines
  // otherwise. One clock: Date.now() deltas only.
  useEffect(() => {
    if (phase !== "racing" || !race) return;
    const bundle = simBundleRef.current;
    if (!bundle || bundle.frames.length === 0) return;
    const beats: CommentaryBeat[] | null = race.commentary;
    const shownEvents = new Set<number>();
    const shownBeats = new Set<number>();

    // Announcer pacing: lines queue up and release one at a time, at
    // most one per TICKER_GAP_MS, so clustered beats stay readable.
    const queue: string[] = [];
    let lastShownAt = 0;
    const show = (text: string) => {
      tickerIdRef.current += 1;
      const entry = { id: tickerIdRef.current, text };
      setTicker((current) => [entry, ...current].slice(0, 4));
      lastShownAt = Date.now();
    };
    const push = (text: string) => {
      queue.push(text);
    };
    const drain = (all = false) => {
      while (
        queue.length > 0 &&
        (all || Date.now() - lastShownAt >= TICKER_GAP_MS)
      ) {
        const next = queue.shift();
        if (next) show(next);
        if (!all) break;
      }
    };

    const step = () => {
      const elapsedSec = Math.max(
        0,
        (Date.now() - raceStartAtRef.current) / 1000,
      );
      const tickFloat = elapsedSec * TICKS_PER_SECOND;
      const tick = Math.floor(tickFloat);
      const frames = bundle.frames;

      if (beats) {
        beats.forEach((beat, index) => {
          if (beat.atSec <= elapsedSec && !shownBeats.has(index)) {
            shownBeats.add(index);
            push(beat.text);
          }
        });
      } else {
        bundle.sim.events.forEach((event, index) => {
          if (event.tick <= tick && !shownEvents.has(index)) {
            shownEvents.add(index);
            const line = EVENT_LINE[event.type]?.(
              race.card.racers[event.racer].name,
            );
            if (line) push(line);
          }
        });
      }
      drain();

      // Photo-finish flash the instant the winner hits the wire.
      const winnerFinish = bundle.sim.events.find(
        (e) => e.type === "finish" && e.detail === 1,
      );
      if (
        winnerFinish &&
        tick >= winnerFinish.tick &&
        flashedSeedRef.current !== race.seed
      ) {
        flashedSeedRef.current = race.seed;
        setFlash(true);
        window.setTimeout(() => setFlash(false), 450);
      }

      if (tick >= frames.length - 1) {
        setPositions(frames[frames.length - 1]);
        drain(true); // the finish call must never sit in the queue
        setPhase("results");
        return;
      }
      const frac = tickFloat - tick;
      const a = frames[tick];
      const b = frames[tick + 1];
      setPositions(a.map((pos, i) => pos + (b[i] - pos) * frac));
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, race]);

  // Settlement (exactly once per race) + the 10-second cooldown that
  // auto-deals the next field.
  useEffect(() => {
    if (phase !== "results" || !race) return;
    const bundle = simBundleRef.current;
    if (bundle && settledSeedRef.current !== race.seed) {
      settledSeedRef.current = race.seed;
      const bet = betRef.current;
      if (bet && !bet.settled) {
        const won = bundle.sim.finishOrder[0] === bet.racer;
        const winnings = won ? Math.round(bet.amount * bet.decimal) : 0;
        if (won) deposit(winnings);
        setPayout(winnings);
        const settled = { ...bet, settled: true };
        setBetPlaced(settled);
        saveBet(settled);
        setDerby((current) =>
          recordResult(current, {
            seed: race.seed,
            racer: race.card.racers[bet.racer]?.name ?? "?",
            amount: bet.amount,
            net: won ? winnings - bet.amount : -bet.amount,
          }),
        );
      }
    }
    setNextIn(NEXT_RACE_BUFFER_SEC);
    const started = Date.now();
    const interval = window.setInterval(() => {
      const left = NEXT_RACE_BUFFER_SEC - (Date.now() - started) / 1000;
      if (left <= 0) {
        window.clearInterval(interval);
        setRaceNumber((n) => n + 1);
        void dealRace();
      } else {
        setNextIn(Math.ceil(left));
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [phase, race, dealRace]);

  if (phase === "loading" || !race) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
        Walking the horses out...
      </div>
    );
  }
  const card = race.card;
  const odds = race.odds;
  const canBet = phase === "betting" && !betPlaced;
  /** 8-frame gallop: one frame per 4 track units (~10 fps at race pace). */
  const frameFor = (i: number): number =>
    phase === "racing" ? Math.floor(positions[i] / 4) % 8 : 0;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        height: "100%",
        fontSize: 13,
        userSelect: "none",
      }}
    >
      {sharkOpen && (
        <VincentDialog
          visit={derby.shark.count + 1}
          onAccept={acceptShark}
          onDismiss={dismissShark}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <strong
          title={
            isLive ? "Live AI field" : "Local field (track feed unavailable)"
          }
        >
          RACE #{raceNumber}
        </strong>
        <button
          type="button"
          onClick={() => setView(view === "track" ? "records" : "track")}
          style={{ ...BTN, fontSize: 11, marginLeft: 6 }}
        >
          {view === "track" ? "RECORDS" : "BACK TO TRACK"}
        </button>
        <span style={{ marginLeft: "auto" }}>J${balance.toLocaleString()}</span>
      </div>
      {view === "records" ? (
        <RecordsPanel state={derby} />
      ) : (
        <>
          {welcomeBack && phase === "betting" && (
            <div
              style={{
                border: "2px inset #808080",
                background: "#f4f1ea",
                padding: "4px 8px",
                fontSize: 12,
              }}
            >
              {welcomeBack}
            </div>
          )}

          {/* Betting board */}
          {phase === "betting" && (
            <div style={{ border: "2px inset #808080", background: "#fff" }}>
              {card.racers.map((racer, i) => (
                <button
                  key={racer.name}
                  type="button"
                  onClick={() => canBet && setPick(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "3px 8px",
                    textAlign: "left",
                    border: "none",
                    borderBottom: "1px solid #ddd",
                    cursor: canBet ? "pointer" : "default",
                    background: pick === i ? "#dbe8f8" : "#fff",
                  }}
                >
                  <HorseSprite hue={racer.hue} scale={1} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong>
                      {i + 1}. {racer.name}
                    </strong>
                    <span style={{ color: "#666" }}> — {racer.gimmick}</span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 11,
                        color: "#8a6d3b",
                      }}
                    >
                      {TRAITS[racer.traits[0]]?.label}:{" "}
                      {TRAITS[racer.traits[0]]?.blurb}
                    </span>
                  </span>
                  <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                    x{odds[i]?.decimal.toFixed(1)} ({odds[i]?.fractional})
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* The track: Josh's generated art + code-driven overlays */}
          {phase !== "betting" && (
            <div
              ref={trackRef}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "3 / 2",
                border: "2px inset #808080",
                backgroundImage: `url(${trackArt.src})`,
                backgroundSize: "100% 100%",
                imageRendering: "pixelated",
                overflow: "hidden",
                containerType: "inline-size",
              }}
            >
              {/* Crowd bob + bunting wave (pole column excluded) */}
              <ArtBand
                className="derby-crowd"
                top={TRACK.crowdBand.top}
                bottom={TRACK.crowdBand.bottom}
              />
              <ArtBand
                className="derby-bunting"
                top={TRACK.buntingBand.top}
                bottom={TRACK.buntingBand.bottom}
              />
              {/* Live tote board over the baked-in odds */}
              <div
                style={{
                  position: "absolute",
                  left: `${TRACK.tote.left}%`,
                  top: `${TRACK.tote.top}%`,
                  width: `${TRACK.tote.width}%`,
                  height: `${TRACK.tote.height}%`,
                  background: "#101418",
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  alignItems: "center",
                  justifyItems: "center",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: "clamp(8px, 1.6cqw, 14px)",
                }}
              >
                {card.racers.map((racer, i) => (
                  <div key={racer.name} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        background: `hsl(${racer.hue} 70% 50%)`,
                        color: "#fff",
                        padding: "0 4px",
                        lineHeight: 1.2,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ color: "#f4f1ea", lineHeight: 1.2 }}>
                      {odds[i]?.fractional}
                    </div>
                  </div>
                ))}
              </div>
              {/* Horses in their lanes */}
              {card.racers.map((racer, i) => {
                const laneCenter =
                  TRACK.laneTopPct + TRACK.laneHeightPct * (i + 0.5);
                const runPct =
                  TRACK.gateExitPct +
                  (positions[i] / TRACK_LENGTH) *
                    (TRACK.finishPct + 2 - TRACK.gateExitPct);
                const moving = movingNow[i];
                return (
                  <div
                    key={racer.name}
                    style={{
                      position: "absolute",
                      left: `${runPct}%`,
                      top: `${laneCenter}%`,
                      transform: "translateY(-50%)",
                    }}
                  >
                    {moving && <span className="derby-dust" />}
                    {betPlaced?.racer === i && (
                      <span
                        style={{
                          position: "absolute",
                          top: -12,
                          left: "40%",
                          color: "#ffd84d",
                          fontSize: 11,
                          textShadow: "1px 1px #3c2a00",
                        }}
                      >
                        ★
                      </span>
                    )}
                    <HorseSprite
                      hue={racer.hue}
                      frame={frameFor(i)}
                      scale={horseScale}
                    />
                  </div>
                );
              })}
              {flash && <div className="derby-flash" />}
            </div>
          )}
          {/* Legend: number + color + name (names no longer fit in-lane) */}
          {phase !== "betting" && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2px 10px",
                fontSize: 11,
              }}
            >
              {card.racers.map((racer, i) => (
                <span key={racer.name} style={{ whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      background: `hsl(${racer.hue} 70% 50%)`,
                      border: "1px solid #2b2b27",
                      marginRight: 3,
                      verticalAlign: -1,
                    }}
                  />
                  {i + 1}. {racer.name}
                  {betPlaced?.racer === i ? " ★" : ""}
                </span>
              ))}
            </div>
          )}

          {/* Announcer ticker: sized to its lines (never clipped), and
              kept on screen through results so the finish call reads. */}
          {(phase === "racing" || phase === "results") && (
            <div
              style={{
                border: "2px inset #808080",
                background: "#14141c",
                color: "#7bd88f",
                fontFamily: "monospace",
                fontSize: 12,
                lineHeight: 1.55,
                padding: "6px 10px",
                minHeight: `calc(4 * 1.55em + 12px)`,
                flexShrink: 0,
                overflowWrap: "anywhere",
              }}
            >
              {ticker.length === 0 ? "And they're off!" : null}
              {ticker.map((entry) => (
                <div key={entry.id}>{entry.text}</div>
              ))}
            </div>
          )}

          {/* Results */}
          {phase === "results" && simBundleRef.current && (
            <div
              style={{
                border: "2px inset #808080",
                background: "#f4f1ea",
                padding: 8,
              }}
            >
              {simBundleRef.current.sim.finishOrder
                .slice(0, 3)
                .map((racerIndex, place) => (
                  <div
                    key={racerIndex}
                    style={{ fontWeight: place === 0 ? 700 : 400 }}
                  >
                    {["1st", "2nd", "3rd"][place]} —{" "}
                    {card.racers[racerIndex].name}
                  </div>
                ))}
              {betPlaced && payout !== null && (
                <div
                  style={{
                    marginTop: 6,
                    fontWeight: 700,
                    color: payout > 0 ? "#1b6b2e" : "#a03030",
                  }}
                >
                  {payout > 0
                    ? `${card.racers[betPlaced.racer].name} delivers! +J$${payout.toLocaleString()}`
                    : `${card.racers[betPlaced.racer].name} let you down. -J$${betPlaced.amount.toLocaleString()}`}
                </div>
              )}
              {!betPlaced && (
                <div style={{ marginTop: 6 }}>You watched. Wisely?</div>
              )}
            </div>
          )}

          {/* Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: "auto",
            }}
          >
            {phase === "betting" && (
              <>
                <span>Bet:</span>
                <input
                  type="number"
                  min={1}
                  value={betAmount}
                  disabled={!canBet}
                  onChange={(e) => setBetAmount(e.target.value)}
                  style={{ ...BTN, width: 80, cursor: "text" }}
                />
                {!betPlaced ? (
                  <button
                    type="button"
                    onClick={placeBet}
                    disabled={
                      pick === null ||
                      Math.floor(Number(betAmount)) < 1 ||
                      Math.floor(Number(betAmount)) > balance
                    }
                    style={{ ...BTN, fontWeight: 700 }}
                  >
                    {pick === null
                      ? "PICK A RACER"
                      : `BET ON ${card.racers[pick].name.toUpperCase()}`}
                  </button>
                ) : (
                  <span style={{ fontWeight: 700 }}>
                    J${betPlaced.amount.toLocaleString()} on{" "}
                    {card.racers[betPlaced.racer].name} ✓
                  </span>
                )}
                <button
                  type="button"
                  onClick={startRace}
                  style={{ ...BTN, fontWeight: 700, marginLeft: "auto" }}
                >
                  {betPlaced ? "START RACE" : "WATCH ONLY"}
                </button>
              </>
            )}
            {phase === "racing" && <span>Racing...</span>}
            {phase === "results" && (
              <span style={{ color: "#555" }}>
                Next race in {nextIn}s — the field is warming up.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RecordsPanel({ state }: { state: DerbyState }) {
  const r = state.records;
  const winRate = r.bets > 0 ? Math.round((r.wins / r.bets) * 100) : 0;
  const rows: Array<[string, string]> = [
    ["Bets placed", String(r.bets)],
    ["Win rate", `${winRate}%`],
    ["Biggest win", `+J$${r.biggestWin.toLocaleString()}`],
    ["Biggest loss", `-J$${r.biggestLoss.toLocaleString()}`],
    ["Longest losing streak", String(r.longestLoseStreak)],
    ["Times bailed out by Vincent", String(state.shark.count)],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
      <div
        style={{ border: "2px inset #808080", background: "#fff", padding: 8 }}
      >
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "flex", padding: "2px 0" }}>
            <span>{label}</span>
            <strong style={{ marginLeft: "auto" }}>{value}</strong>
          </div>
        ))}
      </div>
      <div
        style={{
          border: "2px inset #808080",
          background: "#fff",
          padding: 8,
          flex: 1,
          overflowY: "auto",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Recent races</div>
        {state.history.length === 0 && (
          <div style={{ color: "#666" }}>
            No bets yet. The track is patient.
          </div>
        )}
        {state.history.map((entry) => (
          <div
            key={`${entry.seed}-${entry.at}`}
            style={{
              display: "flex",
              padding: "2px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span>{entry.racer}</span>
            <span style={{ color: "#666", marginLeft: 8 }}>
              J${entry.amount}
            </span>
            <strong
              style={{
                marginLeft: "auto",
                color: entry.net > 0 ? "#1b6b2e" : "#a03030",
              }}
            >
              {entry.net > 0 ? "+" : ""}J${entry.net.toLocaleString()}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
