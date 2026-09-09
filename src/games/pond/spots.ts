/**
 * POND.EXE spots and bait catalog: milestones, prices, and the scene
 * palettes. Each spot is a distinct place with its own light — the
 * texture overlay is the creative signature per location (slime
 * streaks in the sewer, drifting puffs in The Cloud, CRT scanlines
 * in the Abyss).
 */
import abyssArt from "./art/abyss.jpg";
import cloudArt from "./art/cloud.jpg";
import lakeArt from "./art/lake.jpg";
import sewerArt from "./art/sewer.jpg";
import type { BaitId, PondSpot } from "./rarity";

/** Generated scene art on top, palette gradient beneath as fallback. */
function scene(artSrc: string, fallback: string): string {
  return `url(${artSrc}) center / cover no-repeat, ${fallback}`;
}

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
      background: scene(
        lakeArt.src,
        "linear-gradient(#7ec8e3 0 34%, #2f6f9e 34% 38%, #1d5d8c 38% 100%)",
      ),
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
      background: scene(
        sewerArt.src,
        "linear-gradient(#5d6157 0 22%, #3f5a38 22% 27%, #2b4426 27% 100%)",
      ),
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
      background: scene(
        cloudArt.src,
        "linear-gradient(#eafaff 0 30%, #bfe6f7 30% 36%, #93cdea 36% 100%)",
      ),
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
      background: scene(
        abyssArt.src,
        "linear-gradient(#241436 0 24%, #170b26 24% 30%, #0a0514 30% 100%)",
      ),
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
