/**
 * DERBY.EXE server: standalone on-demand race generation.
 * Each request deals a fresh race (card + official sim + odds + AI
 * commentary). No schedule, no timers — a race exists because a
 * player asked for one. 2 Haiku calls per race, rate-limited.
 * Code owns ALL mechanics; the LLM writes identities + commentary.
 */
import { z } from "zod";
import { generateLocalCard, rollBalancedStats } from "@/games/derby/localCard";
import type { RacerOdds } from "@/games/derby/odds";
import { priceRace } from "@/games/derby/odds";
import { simulateRace, TICKS_PER_SECOND } from "@/games/derby/sim";
import { TRAIT_IDS, TRAITS } from "@/games/derby/traits";
import type { RaceCard } from "@/games/derby/types";
import { createRng } from "@/games/pond/sprite/rng";
import { generateJson } from "./anthropic";

export interface CommentaryBeat {
  atSec: number;
  text: string;
}

export interface DerbyRace {
  /** Unique id doubling as the deterministic sim seed. */
  seed: string;
  card: RaceCard;
  odds: RacerOdds[];
  /** Null when AI was unavailable; clients fall back to canned lines. */
  commentary: CommentaryBeat[] | null;
}

/** Code-owned mechanical roll: stats, trait, hue per lane. */
function rollMechanics(seed: string) {
  const rng = createRng(`derby:mech:${seed}`);
  return Array.from({ length: 6 }, () => ({
    stats: rollBalancedStats(rng),
    trait: TRAIT_IDS[Math.floor(rng.next() * TRAIT_IDS.length)],
    hue: Math.floor(rng.next() * 360),
  }));
}

const IdentitySchema = z
  .object({
    racers: z
      .array(
        z.object({
          name: z.string().min(2).max(24),
          gimmick: z.string().min(3).max(60),
        }),
      )
      .length(6),
  })
  .refine(
    (value) =>
      new Set(value.racers.map((r) => r.name.toLowerCase())).size === 6,
    { message: "racer names must be unique" },
  );

const IDENTITY_SYSTEM = [
  "You name the field for DERBY.EXE, a creature-racing betting game",
  "inside a Windows-95-style portfolio site. Reply with ONLY a JSON",
  'object: {"racers": [{"name": string, "gimmick": string} x6]} in the',
  "same order as the profiles given. Names: a MIX of funny everyday",
  "things (Gerald, Left Sock, Tax Season), cute (Mochi, Buttons),",
  "classic track names (Midnight Star), with AT MOST one tech",
  "reference in the whole field. Max 22 chars, unique, no quotes.",
  "Gimmick: max 55 chars, deadpan, ONE joke max, and it MUST fit the",
  "racer's mechanical profile (stats + trait) so bettors can",
  "handicap by reading it.",
].join(" ");

async function buildCard(seed: string): Promise<RaceCard> {
  const mech = rollMechanics(seed);
  const profiles = mech
    .map((m, i) => {
      const trait = TRAITS[m.trait];
      return `#${i + 1}: speed ${m.stats.speed}/10, stamina ${m.stats.stamina}/10, chaos ${m.stats.chaos}/10, trait "${trait.label} — ${trait.blurb}"`;
    })
    .join("\n");
  try {
    const identity = await generateJson(
      IDENTITY_SYSTEM,
      `Name this race's field:\n${profiles}`,
      IdentitySchema,
      800,
    );
    return {
      racers: mech.map((m, i) => ({
        name: identity.racers[i].name,
        gimmick: identity.racers[i].gimmick,
        stats: m.stats,
        traits: [m.trait],
        hue: m.hue,
      })),
    };
  } catch (error) {
    console.error("derby: card identity generation failed:", error);
    // Offline fallback: pool identities zipped onto the SAME mechanics
    // (odds and the sim depend on the mechanical roll, never on names).
    const local = generateLocalCard(`fallback:${seed}`);
    return {
      racers: mech.map((m, i) => ({
        name: local.racers[i].name,
        gimmick: local.racers[i].gimmick,
        stats: m.stats,
        traits: [m.trait],
        hue: m.hue,
      })),
    };
  }
}

const CommentarySchema = z.object({
  beats: z
    .array(
      z.object({
        atSec: z.number().min(0).max(60),
        text: z.string().min(3).max(90),
      }),
    )
    .min(4)
    .max(10),
});

const COMMENTARY_SYSTEM = [
  "You are the track announcer for DERBY.EXE, a creature-racing game.",
  "Deadpan, quick, ONE joke per line max. Reply with ONLY a JSON",
  'object: {"beats": [{"atSec": number, "text": string (max 80 chars)}]}',
  "— 6 to 9 beats. Include one at 0 (the call to post) and one at the",
  "finish time calling the winner. Use racer names and their quirks;",
  "react to the actual events at roughly their timestamps.",
].join(" ");

async function buildCommentary(
  card: RaceCard,
  seed: string,
): Promise<CommentaryBeat[] | null> {
  const sim = simulateRace(card, seed, { logOvertakes: true });
  const finishSec = Math.round(sim.durationTicks / TICKS_PER_SECOND);
  const log = sim.events
    .slice(0, 30)
    .map((e) => {
      const name = card.racers[e.racer].name;
      const at = Math.round(e.tick / TICKS_PER_SECOND);
      if (e.type === "finish") return `${at}s: ${name} finishes #${e.detail}`;
      if (e.type === "overtake") return `${at}s: ${name} takes the lead`;
      return `${at}s: ${name} ${e.type}`;
    })
    .join("; ");

  try {
    const result = await generateJson(
      COMMENTARY_SYSTEM,
      [
        `Field: ${card.racers
          .map((r) => `${r.name} (${TRAITS[r.traits[0]]?.label ?? "steady"})`)
          .join(", ")}.`,
        `Race length: ${finishSec}s. Events: ${log}.`,
      ].join("\n"),
      CommentarySchema,
      900,
    );
    return result.beats
      .slice()
      .sort((a, b) => a.atSec - b.atSec)
      .map((beat) => ({ ...beat, atSec: Math.min(beat.atSec, finishSec) }));
  } catch (error) {
    console.error("derby: commentary generation failed:", error);
    return null; // clients fall back to canned event lines
  }
}

/** Deal one fresh, standalone race. */
export async function generateStandaloneRace(): Promise<DerbyRace> {
  const seed = `derby:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
  const card = await buildCard(seed);
  const odds = priceRace(card, seed);
  const commentary = await buildCommentary(card, seed);
  return { seed, card, odds, commentary };
}
