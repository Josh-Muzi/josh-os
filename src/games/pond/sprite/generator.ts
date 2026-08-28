/**
 * POND.EXE fish sprite generator.
 * Part-based, fully deterministic from a seed string.
 * Grid of palette indices -> rendered to canvas elsewhere.
 */

import type { FishPalette, FishVariant } from "./palette";
import { generatePalette, goldenPalette } from "./palette";
import type { Rng } from "./rng";
import { createRng } from "./rng";

export const GRID_W = 32;
export const GRID_H = 20;
const CY = 10; // vertical center row

export type BodyShape = "oval" | "torpedo" | "round" | "eel" | "boxy";
export type TailStyle = "fan" | "fork" | "point";
export type DorsalStyle = "sail" | "spiky" | "low";
export type PatternStyle = "stripes" | "spots" | "band" | "topcoat" | "plain";

export interface FishDna {
  body: BodyShape;
  tail: TailStyle;
  dorsal: DorsalStyle;
  pattern: PatternStyle;
  bodySpan: number; // columns of body length
  halfHeight: number; // max half-height in rows
}

export interface FishSpriteData {
  grid: Uint8Array; // GRID_W * GRID_H palette indices
  palette: FishPalette;
  dna: FishDna;
}

const idx = (x: number, y: number) => y * GRID_W + x;

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_W && y >= 0 && y < GRID_H;
}

function set(grid: Uint8Array, x: number, y: number, v: number): void {
  if (inBounds(x, y)) grid[idx(x, y)] = v;
}

function rollDna(rng: Rng): FishDna {
  const body = rng.pick<BodyShape>(["oval", "torpedo", "round", "eel", "boxy"]);
  const bodySpan =
    body === "eel"
      ? rng.int(18, 21)
      : body === "round"
        ? rng.int(11, 14)
        : rng.int(14, 18);
  const halfHeight =
    body === "eel"
      ? rng.int(3, 4)
      : body === "round"
        ? rng.int(6, 7)
        : rng.int(5, 7);
  return {
    body,
    tail: rng.pick<TailStyle>(["fan", "fork", "point"]),
    dorsal: rng.pick<DorsalStyle>(["sail", "spiky", "low"]),
    pattern: rng.pick<PatternStyle>([
      "stripes",
      "spots",
      "band",
      "topcoat",
      "plain",
    ]),
    bodySpan,
    halfHeight,
  };
}

/** Half-height profile along the body, t: 0 = tail end, 1 = nose. */
function profile(body: BodyShape, t: number): number {
  const ell = Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2));
  switch (body) {
    case "oval":
      return ell;
    case "torpedo":
      return ell * (0.55 + 0.45 * t);
    case "round":
      return Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)) ** 0.7;
    case "eel":
      return 0.62 + 0.38 * Math.sin(Math.PI * t) ** 0.6;
    case "boxy":
      return Math.min(1, 5 * t, 5 * (1 - t)) ** 0.35;
  }
}

interface Layout {
  x0: number; // leftmost body column (tail attaches left of this)
  x1: number; // nose column
}

function layoutFor(dna: FishDna): Layout {
  const x1 = GRID_W - 4;
  return { x0: x1 - dna.bodySpan, x1 };
}

function drawBody(grid: Uint8Array, dna: FishDna, lay: Layout): void {
  for (let x = lay.x0; x <= lay.x1; x++) {
    const t = (x - lay.x0) / (lay.x1 - lay.x0);
    const hh = Math.max(1, Math.round(profile(dna.body, t) * dna.halfHeight));
    for (let y = CY - hh; y <= CY + hh; y++) {
      // Belly: lower third of the column.
      const belly = y > CY + hh * 0.35;
      set(grid, x, y, belly ? 4 : 2);
    }
  }
}

function drawTail(grid: Uint8Array, dna: FishDna, lay: Layout): void {
  const len = dna.tail === "point" ? 4 : 3;
  for (let i = 0; i < len; i++) {
    const x = lay.x0 - 1 - i;
    if (dna.tail === "fan") {
      const hh = 1 + i;
      for (let y = CY - hh; y <= CY + hh; y++) set(grid, x, y, 5);
    } else if (dna.tail === "fork") {
      // Triangle with a notch that deepens leftward: a classic fork.
      const hh = i === 0 ? 2 : 1 + i;
      for (let y = CY - hh; y <= CY + hh; y++) {
        if (i > 0 && Math.abs(y - CY) <= i - 1) continue;
        set(grid, x, y, 5);
      }
    } else {
      const hh = Math.max(0, 2 - i);
      for (let y = CY - hh; y <= CY + hh; y++) set(grid, x, y, 5);
    }
  }
}

function bodyTopAt(dna: FishDna, lay: Layout, x: number): number {
  const t = (x - lay.x0) / (lay.x1 - lay.x0);
  const hh = Math.max(1, Math.round(profile(dna.body, t) * dna.halfHeight));
  return CY - hh;
}

function drawDorsal(
  grid: Uint8Array,
  dna: FishDna,
  lay: Layout,
  rng: Rng,
): void {
  const span = lay.x1 - lay.x0;
  const fx0 = lay.x0 + Math.round(span * 0.35);
  const fx1 = lay.x0 + Math.round(span * 0.68);
  const tall = dna.dorsal === "sail" ? 3 : dna.dorsal === "low" ? 1 : 2;
  for (let x = fx0; x <= fx1; x++) {
    if (dna.dorsal === "spiky" && (x - fx0) % 2 === 1) continue;
    const mid = 1 - Math.abs((x - (fx0 + fx1) / 2) / ((fx1 - fx0) / 2 || 1));
    const h = Math.max(1, Math.round(tall * (0.4 + 0.6 * mid)));
    const top = bodyTopAt(dna, lay, x);
    for (let y = top - h; y < top; y++) set(grid, x, y, 5);
  }
  // Pectoral fin: small notch on the flank near the head.
  const px = lay.x0 + Math.round(span * 0.72);
  set(grid, px, CY + 1, 5);
  set(grid, px - 1, CY + 1, 5);
  set(grid, px - 1, CY + 2, 5);
  if (rng.chance(0.6)) set(grid, px - 2, CY + 2, 5);
}

function applyPattern(
  grid: Uint8Array,
  dna: FishDna,
  lay: Layout,
  rng: Rng,
): void {
  const gap = rng.int(3, 4);
  for (let x = lay.x0; x <= lay.x1; x++) {
    for (let y = 0; y < GRID_H; y++) {
      if (grid[idx(x, y)] !== 2) continue; // only upper body pixels
      const t = (x - lay.x0) / (lay.x1 - lay.x0);
      switch (dna.pattern) {
        case "stripes":
          if (x % gap === 0 && t > 0.08 && t < 0.9) set(grid, x, y, 3);
          break;
        case "spots":
          if (rng.chance(0.16)) set(grid, x, y, 3);
          break;
        case "band":
          if (y >= CY - 1 && y <= CY) set(grid, x, y, 3);
          break;
        case "topcoat":
          if (y <= CY - Math.round(dna.halfHeight * 0.45)) set(grid, x, y, 3);
          break;
        case "plain":
          break;
      }
    }
  }
}

/** Convert edge pixels of the silhouette into outline color. */
function outlinePass(grid: Uint8Array): void {
  const solid = (x: number, y: number) =>
    inBounds(x, y) && grid[idx(x, y)] !== 0;
  const edges: number[] = [];
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (!solid(x, y)) continue;
      if (
        !solid(x - 1, y) ||
        !solid(x + 1, y) ||
        !solid(x, y - 1) ||
        !solid(x, y + 1)
      ) {
        edges.push(idx(x, y));
      }
    }
  }
  for (const i of edges) grid[i] = 1;
}

function drawFace(grid: Uint8Array, dna: FishDna, lay: Layout): void {
  const ex = lay.x1 - 3;
  const ey = CY - Math.max(1, Math.round(dna.halfHeight * 0.4));
  set(grid, ex, ey, 6);
  set(grid, ex + 1, ey, 6);
  set(grid, ex + 1, ey + 1, 7);
  set(grid, ex, ey + 1, 6);
  // Mouth: a one-pixel outline notch at the nose.
  set(grid, lay.x1, CY + 1, 1);
  set(grid, lay.x1 - 1, CY + 1, 1);
}

function applyVariant(
  grid: Uint8Array,
  seed: string,
  variant: FishVariant,
): void {
  const rng = createRng(`${seed}:variant:${variant}`);
  if (variant === "golden") {
    // A few sparkle pixels on the body.
    for (let n = 0; n < 4; n++) {
      const x = rng.int(6, GRID_W - 6);
      const y = rng.int(CY - 4, CY + 4);
      if (grid[idx(x, y)] === 2 || grid[idx(x, y)] === 3) set(grid, x, y, 8);
    }
  }
  if (variant === "glitched") {
    // Shift a few scanlines sideways and scatter hot pixels.
    for (let n = 0; n < 3; n++) {
      const y = rng.int(CY - 5, CY + 5);
      const shift = rng.pick([-2, -1, 1, 2]);
      const row = grid.slice(y * GRID_W, (y + 1) * GRID_W);
      for (let x = 0; x < GRID_W; x++) {
        const sx = x - shift;
        grid[idx(x, y)] = sx >= 0 && sx < GRID_W ? row[sx] : 0;
      }
    }
    for (let n = 0; n < 6; n++) {
      const x = rng.int(4, GRID_W - 4);
      const y = rng.int(2, GRID_H - 3);
      if (grid[idx(x, y)] !== 0) set(grid, x, y, 8);
    }
  }
}

export interface GenerateOptions {
  variant?: FishVariant;
  /** LLM-chosen base hue (0-360); everything else stays seeded. */
  hueOverride?: number;
}

/** The one entry point: seed string in, sprite data out. */
export function generateFish(
  seed: string,
  options: GenerateOptions = {},
): FishSpriteData {
  const variant = options.variant ?? "normal";
  const rng = createRng(`${seed}:dna`);
  const dna = rollDna(rng);
  const lay = layoutFor(dna);
  const grid = new Uint8Array(GRID_W * GRID_H);

  drawBody(grid, dna, lay);
  drawTail(grid, dna, lay);
  drawDorsal(grid, dna, lay, rng);
  applyPattern(grid, dna, lay, rng);
  outlinePass(grid);
  drawFace(grid, dna, lay);
  applyVariant(grid, seed, variant);

  const palette =
    variant === "golden"
      ? goldenPalette()
      : generatePalette(seed, options.hueOverride);
  return { grid, palette, dna };
}
