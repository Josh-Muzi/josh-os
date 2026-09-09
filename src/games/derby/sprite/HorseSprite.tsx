"use client";

/**
 * HorseSprite — renders frames from the real pixel-art gallop sheet
 * (horse-sheet.png: 8 frames, 2 cols x 4 rows, 256x192 per cell =
 * a 64x48 native frame at exact 4x). The sheet is a single brown
 * horse; each racer gets its own hue by tinting body pixels in canvas
 * while dark outline/hoof pixels stay dark (no muddy hue-rotate).
 * Tinted sheets are cached per hue; drawing a frame is one blit.
 */
import { useEffect, useRef } from "react";
import horseSheet from "./horse-sheet.png";

const CELL_W = 256;
const CELL_H = 192;
const COLS = 2;
export const HORSE_FRAMES = 8;
/** Native frame size (sheet is 4x). */
export const HORSE_W = 64;
export const HORSE_H = 48;
/** Pixels darker than this lightness are outline/hooves: never tinted. */
const OUTLINE_LIGHTNESS = 0.22;

let sheetPromise: Promise<HTMLImageElement> | null = null;
function loadSheet(): Promise<HTMLImageElement> {
  if (!sheetPromise) {
    sheetPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = horseSheet.src;
    });
  }
  return sheetPromise;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ];
}

const tintCache = new Map<number, HTMLCanvasElement>();
/** Hues snap to 15° buckets: 24 cached sheets max (~36MB) instead of 360. */
const HUE_BUCKET = 15;

/** The whole sheet re-hued for one racer (cached per hue bucket). */
function tintedSheet(img: HTMLImageElement, hue: number): HTMLCanvasElement {
  const key = (Math.round(hue / HUE_BUCKET) * HUE_BUCKET) % 360;
  const cached = tintCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = image.data;
  const targetHue = key / 360;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const [, s, l] = rgbToHsl(px[i], px[i + 1], px[i + 2]);
    if (l < OUTLINE_LIGHTNESS) continue; // outline + hooves stay dark
    const [r, g, b] = hslToRgb(targetHue, s, l);
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
  }
  ctx.putImageData(image, 0, 0);
  tintCache.set(key, canvas);
  return canvas;
}

interface HorseSpriteProps {
  hue: number;
  /** Gallop frame 0-7. */
  frame?: number;
  /** Multiplier on the 64x48 native size. */
  scale?: number;
}

export function HorseSprite({ hue, frame = 0, scale = 1 }: HorseSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = HORSE_W * scale;
  const height = HORSE_H * scale;

  useEffect(() => {
    let cancelled = false;
    loadSheet()
      .then((img) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        const sheet = tintedSheet(img, hue);
        const index = ((frame % HORSE_FRAMES) + HORSE_FRAMES) % HORSE_FRAMES;
        const sx = (index % COLS) * CELL_W;
        const sy = Math.floor(index / COLS) * CELL_H;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(sheet, sx, sy, CELL_W, CELL_H, 0, 0, width, height);
      })
      .catch(() => {
        // Sheet missing: the lane simply shows no horse rather than crashing.
      });
    return () => {
      cancelled = true;
    };
  }, [hue, frame, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated", display: "block" }}
      aria-label="Pixel racehorse"
    />
  );
}
