// DERBY sim tuning harness. Run from repo root:
// npx -y esbuild scripts/derby-sim.mts --bundle --format=esm --outfile=scripts/.derby-sim.mjs && node scripts/.derby-sim.mjs
import { priceRace } from "../src/games/derby/odds";
import { simulateRace, TICKS_PER_SECOND } from "../src/games/derby/sim";
import type { RaceCard } from "../src/games/derby/types";

const card: RaceCard = {
  racers: [
    {
      name: "Blue Screen",
      gimmick: "fast, may stop",
      stats: { speed: 9, stamina: 4, chaos: 8 },
      traits: ["energy_drink"],
      hue: 220,
    },
    {
      name: "Dial-Up",
      gimmick: "slow and steady",
      stats: { speed: 4, stamina: 9, chaos: 2 },
      traits: ["not_morning"],
      hue: 30,
    },
    {
      name: "Popup Ad",
      gimmick: "keeps appearing",
      stats: { speed: 7, stamina: 6, chaos: 6 },
      traits: ["coin_flip"],
      hue: 300,
    },
    {
      name: "Screensaver",
      gimmick: "naps",
      stats: { speed: 6, stamina: 7, chaos: 5 },
      traits: ["unionized"],
      hue: 120,
    },
    {
      name: "Overclock",
      gimmick: "burns bright",
      stats: { speed: 10, stamina: 2, chaos: 4 },
      traits: ["morning_person"],
      hue: 0,
    },
    {
      name: "Beige Box",
      gimmick: "reliable",
      stats: { speed: 5, stamina: 8, chaos: 1 },
      traits: ["emotionally_stable"],
      hue: 45,
    },
  ],
};

// 1) Determinism: same seed twice must match exactly.
const a = simulateRace(card, "check", { logOvertakes: true });
const b = simulateRace(card, "check", { logOvertakes: true });
const deterministic =
  JSON.stringify(a.finishOrder) === JSON.stringify(b.finishOrder) &&
  a.events.length === b.events.length &&
  a.durationTicks === b.durationTicks;
console.log(`determinism: ${deterministic ? "PASS" : "FAIL"}`);

// 2) Distribution over 1000 races: do stats matter but chaos keep hope?
const RUNS = 1000;
const winCounts = new Array(6).fill(0);
const podiumCounts = new Array(6).fill(0);
let totalTicks = 0;
let totalChaosEvents = 0;
for (let i = 0; i < RUNS; i++) {
  const r = simulateRace(card, `dist:${i}`);
  winCounts[r.finishOrder[0]]++;
  for (const p of r.finishOrder.slice(0, 3)) podiumCounts[p]++;
  totalTicks += r.durationTicks;
  totalChaosEvents += r.events.filter((e) =>
    ["stall", "burst", "wrongway", "nap"].includes(e.type),
  ).length;
}
console.log("\nname            win%   podium%");
card.racers.forEach((racer, i) => {
  const w = ((winCounts[i] / RUNS) * 100).toFixed(1).padStart(5);
  const p = ((podiumCounts[i] / RUNS) * 100).toFixed(1).padStart(6);
  console.log(`${racer.name.padEnd(14)} ${w}  ${p}`);
});
console.log(
  `\navg race: ${(totalTicks / RUNS / TICKS_PER_SECOND).toFixed(1)}s ` +
    `| avg chaos events/race: ${(totalChaosEvents / RUNS).toFixed(1)}`,
);

// 3) Odds sanity from Monte Carlo pricing.
const odds = priceRace(card, "odds-demo", 300);
console.log("\nodds:");
card.racers.forEach((racer, i) => {
  const o = odds[i];
  console.log(
    `${racer.name.padEnd(14)} x${o.decimal.toFixed(1).padStart(4)} (${o.fractional})  p=${(o.winProbability * 100).toFixed(1)}%`,
  );
});

// 4) Trait impact: identical stats, different traits -> different fates.
const cloneCard: RaceCard = {
  racers: (
    [
      "morning_person",
      "drama_queen",
      "stage_fright",
      "coin_flip",
      "built_like_fridge",
      "legs_too_small",
    ] as const
  ).map((trait, i) => ({
    name: trait,
    gimmick: "clone",
    stats: { speed: 6, stamina: 6, chaos: 5 },
    traits: [trait],
    hue: i * 60,
  })),
};
const cloneWins = new Array(6).fill(0);
for (let i = 0; i < RUNS; i++) {
  const r = simulateRace(cloneCard, `clone:${i}`);
  cloneWins[r.finishOrder[0]]++;
}
console.log("\ntrait impact (identical stats, 1000 races):");
cloneCard.racers.forEach((racer, i) => {
  console.log(
    `${racer.name.padEnd(18)} ${((cloneWins[i] / RUNS) * 100).toFixed(1)}%`,
  );
});
