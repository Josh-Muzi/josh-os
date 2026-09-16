import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "josh-os",
    name: "JoshOS (this site)",
    tagline: "A Windows 95-style desktop that happens to be my portfolio.",
    description: [
      "Custom window manager (React context + reducer) with focus, z-index, minimize, and maximize — plus draggable desktop icons. No UI framework: hand-built modern chrome, hand-drawn pixel icons, react-rnd for drag/resize.",
      "One typed content source renders as draggable windows on desktop and as a fast, accessible single page on phones. The desktop ships two AI-powered games (below) that share a wallet and a server-side AI layer.",
    ],
    stack: [
      "Next.js 16",
      "TypeScript",
      "React",
      "Tailwind",
      "react-rnd",
      "Vercel",
    ],
    repoUrl: "https://github.com/Josh-Muzi/josh-os",
    status: "in-progress",
  },
  {
    slug: "pond-exe",
    name: "POND.EXE",
    tagline: "A fishing game with an infinite, AI-invented fish-dex.",
    description: [
      "Every catch is a new species: Claude Haiku names it, writes its one-line lore, and picks its color, while a deterministic sprite generator (seeded PRNG, part-based pixel bodies) draws it. Rarity, reel physics, and drop rates live entirely in code — the model only supplies creativity, never rules.",
      "Four milestone-locked fishing spots with generated art, purchasable bait stacks that bias the odds, a shared daily weather line, and a persisted FishDex. Server routes validate input with Zod, cache common species globally (Infinite Craft-style), rate-limit per IP, and fall back to offline names so the game never breaks.",
    ],
    stack: [
      "TypeScript",
      "React",
      "Next.js Route Handlers",
      "Claude API (Haiku)",
      "Zod",
      "Canvas",
      "Upstash Redis",
    ],
    repoUrl: "https://github.com/Josh-Muzi/josh-os/tree/main/src/games/pond",
    status: "live",
  },
  {
    slug: "derby-exe",
    name: "DERBY.EXE",
    tagline: "Bet JoshBucks on AI-named creatures in a deterministic race sim.",
    description: [
      "A 30-tick-per-second race simulation, fully deterministic from a seed, with stats, funny traits that carry real mechanics (stall-prone, drama queen, built like a fridge), rubber-banding, and chaos events. Odds are priced by Monte Carlo — 200 simulated runs per race with a house edge — so trait power is priced in automatically.",
      "Claude writes each field's names and gimmicks around code-rolled mechanics and calls the race afterward with timestamped commentary. Generated pixel horses are tinted per racer in canvas; a live tote board renders real odds over generated track art. Includes a persisted wallet with refund/settle rules, race history and records, and Vincent, the loan shark.",
    ],
    stack: [
      "TypeScript",
      "React",
      "Simulation design",
      "Monte Carlo pricing",
      "Claude API (Haiku)",
      "Zod",
      "Canvas",
      "Upstash Redis",
    ],
    repoUrl: "https://github.com/Josh-Muzi/josh-os/tree/main/src/games/derby",
    status: "live",
  },
];
