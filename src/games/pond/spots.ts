/**
 * POND.EXE spots and bait catalog: milestones, prices, and the scene
 * palettes. Each spot is a distinct place with its own light — the
 * texture overlay is the creative signature per location (slime
 * streaks in the sewer, drifting puffs in The Cloud, CRT scanlines
 * in the Abyss).
 */
import type { BaitId, PondSpot } from "./rarity";

export interface SpotConfig {
  id: PondSpot;
  label: string;
  /** Species discovered required to unlock. */
  milestone: number;
  idleLine: string;
  scene: {
    /** Stacked CSS backgrounds: texture overlay first, gradient last. */
    background: string;
    /** Message + weather text color and its 1px shadow. */
    text: string;
    textShadow: string;
  };
}

export const SPOTS: SpotConfig[] = [
  {
    id: "lake",
    label: "Lake",
    milestone: 0,
    idleLine: "The pond is quiet. Cast when ready.",
    scene: {
      background:
        "linear-gradient(#7ec8e3 0 34%, #2f6f9e 34% 38%, #1d5d8c 38% 100%)",
      text: "#eaf6ff",
      textShadow: "1px 1px #1d5d8c",
    },
  },
  {
    id: "sewer",
    label: "Sewer",
    milestone: 8,
    idleLine: "Something drips. The mall above is long dead.",
    scene: {
      // Slime streaks: sparse diagonal lines over murky green water.
      background: [
        "repeating-linear-gradient(115deg, transparent 0 26px, rgba(142,180,90,0.16) 26px 29px)",
        "linear-gradient(#5d6157 0 22%, #3f5a38 22% 27%, #2b4426 27% 100%)",
      ].join(", "),
      text: "#dcedc4",
      textShadow: "1px 1px #1e3019",
    },
  },
  {
    id: "cloud",
    label: "The Cloud",
    milestone: 20,
    idleLine: "You are fishing in the sky. The uploads swim below.",
    scene: {
      // Drifting puffs: soft white bands floating on pale cyan sky.
      background: [
        "repeating-linear-gradient(178deg, transparent 0 34px, rgba(255,255,255,0.5) 34px 42px, transparent 42px 76px)",
        "linear-gradient(#eafaff 0 30%, #bfe6f7 30% 36%, #93cdea 36% 100%)",
      ].join(", "),
      text: "#1d5d8c",
      textShadow: "1px 1px #ffffff",
    },
  },
  {
    id: "abyss",
    label: "Recycle Bin Abyss",
    milestone: 35,
    idleLine: "Everything deleted ends up here. It remembers you.",
    scene: {
      // CRT scanlines over near-black purple: the deleted place.
      background: [
        "repeating-linear-gradient(0deg, transparent 0 3px, rgba(150,90,255,0.09) 3px 4px)",
        "linear-gradient(#241436 0 24%, #170b26 24% 30%, #0a0514 30% 100%)",
      ].join(", "),
      text: "#cbb2ff",
      textShadow: "1px 1px #000000",
    },
  },
];

export function spotConfig(id: PondSpot): SpotConfig {
  return SPOTS.find((s) => s.id === id) ?? SPOTS[0];
}

export function unlockedSpots(speciesCount: number): PondSpot[] {
  return SPOTS.filter((s) => speciesCount >= s.milestone).map((s) => s.id);
}

export interface BaitConfig {
  id: BaitId;
  label: string;
  /** JoshBucks per stack; bare hook is free and infinite. */
  price: number;
  /** Casts per purchased stack. */
  stack: number;
  blurb: string;
}

export const BAITS: BaitConfig[] = [
  {
    id: "bare",
    label: "Bare Hook",
    price: 0,
    stack: 0,
    blurb: "Free. Optimistic.",
  },
  {
    id: "worm",
    label: "Worm",
    price: 25,
    stack: 10,
    blurb: "A classic. Slightly better odds.",
  },
  {
    id: "floppy",
    label: "Floppy Disk",
    price: 60,
    stack: 10,
    blurb: "Attracts data hoarders. Rare bites up.",
  },
  {
    id: "ram",
    label: "RAM Stick",
    price: 150,
    stack: 10,
    blurb: "Fast fish can't resist. Legendary odds up.",
  },
];

export function baitConfig(id: BaitId): BaitConfig {
  return BAITS.find((b) => b.id === id) ?? BAITS[0];
}
