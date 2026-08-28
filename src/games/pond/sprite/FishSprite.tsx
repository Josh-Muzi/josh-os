"use client";

/**
 * Renders a generated fish to a crisp, pixelated canvas.
 */
import { useEffect, useRef } from "react";
import type { GenerateOptions } from "./generator";
import { GRID_H, GRID_W, generateFish } from "./generator";

interface FishSpriteProps extends GenerateOptions {
  seed: string;
  /** Pixel scale factor. 6 => 192x120 canvas. */
  scale?: number;
}

export function FishSprite({
  seed,
  scale = 6,
  variant,
  hueOverride,
}: FishSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { grid, palette } = generateFish(seed, { variant, hueOverride });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const v = grid[y * GRID_W + x];
        if (v === 0) continue;
        ctx.fillStyle = palette.colors[v];
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }, [seed, scale, variant, hueOverride]);

  return (
    <canvas
      ref={canvasRef}
      width={GRID_W * scale}
      height={GRID_H * scale}
      style={{ imageRendering: "pixelated" }}
      aria-label={`Pixel fish ${seed}`}
    />
  );
}
