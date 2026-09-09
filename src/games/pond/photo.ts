"use client";

/**
 * Photo mode: render a catch as a shareable PNG card. Everything is
 * drawn onto an offscreen canvas — sprite from the deterministic
 * generator, stats, flavor text — and stamped with the site domain.
 */
import { GRID_H, GRID_W, generateFish } from "./sprite/generator";
import type { CatchResult, Rarity } from "./types";
import { RARITY_LABEL } from "./types";

const SITE = "JoshMuzi.com";
const W = 640;
const H = 400;

const RARITY_TINT: Record<Rarity, [string, string]> = {
  common: ["#4a4a44", "#2b2b27"],
  uncommon: ["#2f9e44", "#1b6b2e"],
  rare: ["#5b8fd0", "#3b6ea5"],
  legendary: ["#d04aa0", "#a5307a"],
  anomaly: ["#1fb5b5", "#008080"],
};

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function renderCatchCard(result: CatchResult): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const [tintA, tintB] = RARITY_TINT[result.rarity];

  // Backdrop: rarity gradient + a cream card.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, tintA);
  bg.addColorStop(1, tintB);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f4f1ea";
  ctx.fillRect(20, 20, W - 40, H - 40);
  ctx.strokeStyle = tintB;
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, W - 44, H - 44);

  // Fish sprite, pixel-crisp at 6x, on the left.
  const fish = generateFish(result.seed, {
    variant: result.variant,
    hueOverride: result.hue,
  });
  const scale = 6;
  const fx = 44;
  const fy = Math.round((H - GRID_H * scale) / 2);
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const v = fish.grid[y * GRID_W + x];
      if (!v) continue;
      ctx.fillStyle = fish.palette.colors[v] ?? "#000";
      ctx.fillRect(fx + x * scale, fy + y * scale, scale, scale);
    }
  }

  // Text block on the right.
  const tx = fx + GRID_W * scale + 28;
  const maxWidth = W - tx - 40;
  ctx.fillStyle = "#2b2b27";
  ctx.font = "bold 28px ui-sans-serif, system-ui, sans-serif";
  const nameLines = wrap(ctx, result.name, maxWidth).slice(0, 2);
  let y = 96;
  for (const line of nameLines) {
    ctx.fillText(line, tx, y);
    y += 32;
  }
  ctx.fillStyle = tintB;
  ctx.font = "bold 16px ui-sans-serif, system-ui, sans-serif";
  const tags = [
    RARITY_LABEL[result.rarity],
    result.variant === "golden" ? "GOLDEN" : null,
    result.perfect ? "PERFECT CATCH" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  ctx.fillText(tags, tx, y + 4);
  y += 30;
  ctx.fillStyle = "#2b2b27";
  ctx.font = "18px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`${result.sizeCm} cm`, tx, y + 4);
  y += 34;
  ctx.fillStyle = "#4a4a44";
  ctx.font = "italic 15px ui-sans-serif, system-ui, sans-serif";
  for (const line of wrap(ctx, result.flavor, maxWidth)) {
    ctx.fillText(line, tx, y);
    y += 21;
  }

  // Footer stamp.
  ctx.fillStyle = tintB;
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillText(`POND.EXE  ·  caught at ${SITE}`, 40, H - 40);
  return canvas;
}

/** Trigger a PNG download of the card. */
export function downloadCatchCard(result: CatchResult): void {
  const canvas = renderCatchCard(result);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-pond-exe.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
