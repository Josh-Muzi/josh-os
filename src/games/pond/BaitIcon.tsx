"use client";

/**
 * 12x12 pixel icons for the tackle box. [x, y, w, h, color]
 * Tiny, flat, one accent each — the retro lives here, not in the chrome.
 */
import type { BaitId } from "./rarity";

type Px = [number, number, number, number, string];

const INK = "#3b3b36";
const ICONS: Record<BaitId, Px[]> = {
  // Bare hook: a J-shaped hook.
  bare: [
    [6, 1, 1, 7, INK],
    [3, 8, 4, 1, INK],
    [2, 6, 1, 2, INK],
    [7, 7, 1, 1, INK],
    [6, 0, 2, 1, "#8a8a80"],
  ],
  // Worm: pink segmented squiggle.
  worm: [
    [1, 7, 3, 2, "#e07a8a"],
    [3, 5, 3, 2, "#e07a8a"],
    [5, 3, 3, 2, "#e07a8a"],
    [8, 5, 3, 2, "#e07a8a"],
    [9, 5, 1, 1, INK],
  ],
  // Floppy disk: blue body, dark shutter, white label.
  floppy: [
    [1, 1, 10, 10, "#3b6ea5"],
    [3, 1, 6, 4, "#2b2b27"],
    [7, 2, 1, 2, "#ddd"],
    [3, 7, 6, 3, "#f4f1ea"],
  ],
  // RAM stick: green board, gold contacts, black chips.
  ram: [
    [1, 3, 10, 5, "#2f9e44"],
    [2, 4, 2, 2, INK],
    [5, 4, 2, 2, INK],
    [8, 4, 2, 2, INK],
    [1, 8, 10, 2, "#f6d372"],
    [3, 8, 1, 2, "#2f9e44"],
    [6, 8, 1, 2, "#2f9e44"],
    [9, 8, 1, 2, "#2f9e44"],
  ],
};

export function BaitIcon({ id, size = 14 }: { id: BaitId; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`${id} bait`}
      style={{ flexShrink: 0 }}
    >
      <title>{`${id} bait`}</title>
      {ICONS[id].map(([x, y, w, h, fill]) => (
        <rect
          key={`${x}-${y}-${w}-${h}`}
          x={x}
          y={y}
          width={w}
          height={h}
          fill={fill}
        />
      ))}
    </svg>
  );
}
