/**
 * POND.EXE server-side generation: daily weather + fish identities.
 * All player-supplied inputs are enums/numbers (validated in routes),
 * so no user text ever reaches a prompt.
 */
import { z } from "zod";
import { clipText, generateJson } from "./anthropic";
import { cacheGet, cacheSet } from "./cache";

export const POND_SPOTS = ["lake", "sewer", "cloud", "abyss"] as const;
export type PondSpot = (typeof POND_SPOTS)[number];

const SPOT_THEME: Record<PondSpot, string> = {
  lake: "a quiet suburban pond behind an office park in 1998",
  sewer: "a storm sewer beneath a dead shopping mall",
  cloud: "The Cloud — fish that live inside uploaded data",
  abyss: "the Recycle Bin Abyss, where deleted things swim",
};

const WeatherSchema = z.object({
  headline: z.string().min(3).max(60),
  mood: z.string().min(3).max(90),
});
export type PondWeather = z.infer<typeof WeatherSchema>;

const FALLBACK_WEATHER: PondWeather = {
  headline: "Partly pixelated, light lag",
  mood: "an ordinary, slightly buffering day at the pond",
};

function msUntilNextUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return next - now.getTime();
}

/** One shared weather per UTC day; one generation serves everyone. */
export async function getDailyWeather(): Promise<PondWeather> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `pond:weather:${day}`;
  const cached = await cacheGet<PondWeather>(key);
  if (cached) return cached;
  try {
    const weather = await generateJson(
      [
        "You invent daily in-game weather for POND.EXE, a fishing game",
        "inside a Windows-95-style portfolio site. Deadpan retro-tech",
        "humor, at most one joke. Reply with ONLY a JSON object:",
        '{"headline": string (max 60 chars, shown to players, e.g.',
        '"Acid drizzle, corrupted fish biting"), "mood": string (max 90',
        "chars, a scene-setting phrase fed to another generator).}",
      ].join(" "),
      `Invent the pond weather for ${day}. Vary it from typical days.`,
      WeatherSchema,
      150,
    );
    await cacheSet(key, weather, msUntilNextUtcMidnight());
    return weather;
  } catch {
    await cacheSet(key, FALLBACK_WEATHER, msUntilNextUtcMidnight());
    return FALLBACK_WEATHER;
  }
}

// Tolerant: clip over-long text at a word boundary and normalize the
// hue instead of rejecting the whole fish over a few characters.
const FishIdentitySchema = z.object({
  name: z
    .string()
    .min(2)
    .transform((s) => clipText(s, 32)),
  flavor: z
    .string()
    .min(3)
    .transform((s) => clipText(s, 110)),
  hue: z.number().transform((h) => ((Math.round(h) % 360) + 360) % 360),
});
export type FishIdentity = z.infer<typeof FishIdentitySchema>;

export const POND_BAITS = ["bare", "worm", "floppy", "ram"] as const;
export type PondBait = (typeof POND_BAITS)[number];

/** Server-side bait flavor: the client only ever sends an enum id. */
const BAIT_HINT: Record<PondBait, string> = {
  bare: "",
  worm: "Caught on a classic worm: ordinary, organic, nostalgic fish.",
  floppy: "Caught on floppy-disk bait: data-hoarding, storage-themed fish.",
  ram: "Caught on RAM-stick bait: fast, overclocked, memory-themed fish.",
};

export interface CatchRequest {
  rarity: "common" | "uncommon" | "rare" | "legendary" | "anomaly";
  spot: PondSpot;
  sizeCm: number;
  variant: "normal" | "golden";
  bait: PondBait;
}

interface SpeciesCacheEntry {
  species: FishIdentity[];
}

const SPECIES_CAP = 40;
/** Commons/uncommons reuse a cached species this often once seeded. */
const REUSE_CHANCE = 0.5;
const MIN_POOL_FOR_REUSE = 5;

function speciesKey(spot: PondSpot, rarity: CatchRequest["rarity"]): string {
  return `pond:species:${spot}:${rarity}`;
}

/**
 * The Infinite Craft-style cost lever: common species get shared and
 * reused globally ("a school of Dial-Up Eels exists"); rare+ are
 * always freshly generated so big catches stay one-of-a-kind.
 */
export async function generateFishIdentity(
  req: CatchRequest,
): Promise<FishIdentity> {
  const key = speciesKey(req.spot, req.rarity);
  const pool = (await cacheGet<SpeciesCacheEntry>(key)) ?? { species: [] };
  const canReuse = req.rarity === "common" || req.rarity === "uncommon";
  if (
    canReuse &&
    pool.species.length >= MIN_POOL_FOR_REUSE &&
    Math.random() < REUSE_CHANCE
  ) {
    return pool.species[Math.floor(Math.random() * pool.species.length)];
  }

  const weather = await getDailyWeather();
  const avoid = pool.species
    .slice(-20)
    .map((s) => s.name)
    .join(", ");
  const identity = await generateJson(
    [
      "You invent fish for POND.EXE, a fishing game in a Windows-95-style",
      "portfolio site. Style: crisp retro-tech deadpan; at most ONE joke",
      "per fish; never stack gags. Reply with ONLY a JSON object:",
      '{"name": string (2-4 words, max 32 chars, no quotes),',
      '"flavor": string (one line, max 110 chars),',
      '"hue": integer 0-359 (base body color for the sprite).}',
    ].join(" "),
    [
      `Invent one ${req.rarity === "anomaly" ? "???-tier ANOMALY" : req.rarity} fish caught in ${SPOT_THEME[req.spot]}.`,
      `It measured ${req.sizeCm} cm.`,
      BAIT_HINT[req.bait],
      req.variant === "golden"
        ? "It is a GOLDEN variant — treat that as remarkable."
        : "",
      `Today's pond weather: ${weather.mood}.`,
      req.rarity === "legendary"
        ? "Legendary fish get mythic, slightly unhinged energy."
        : "",
      req.rarity === "anomaly"
        ? "ANOMALY rules: go fully unhinged. It should barely qualify as a fish. It should not make sense. Family-friendly, but wrong."
        : "",
      avoid ? `Do NOT reuse these existing names: ${avoid}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    FishIdentitySchema,
    200,
  );

  pool.species.push(identity);
  if (pool.species.length > SPECIES_CAP) pool.species.shift();
  await cacheSet(key, pool);
  return identity;
}
