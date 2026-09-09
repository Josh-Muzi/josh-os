"use client";

/**
 * Per-spot atmosphere: a handful of tiny CSS-animated motes that give
 * each scene its weather. Pollen drifts up over the Lake, drips fall
 * in the Sewer, data bits rise through The Cloud, debris sinks in the
 * Abyss. Pure CSS, pointer-events none, seeded so it never flickers.
 */
import type { PondSpot } from "./rarity";

const COUNT = 14;

/** Deterministic pseudo-random per index (no Math.random in render). */
function jitter(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function SceneParticles({ spot }: { spot: PondSpot }) {
  return (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {Array.from({ length: COUNT }, (_, i) => {
        const left = `${Math.round(jitter(i, 1) * 96 + 2)}%`;
        const delay = `${(jitter(i, 2) * 6).toFixed(2)}s`;
        const duration = `${(5 + jitter(i, 3) * 6).toFixed(2)}s`;
        const size = 2 + Math.round(jitter(i, 4) * 2);
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative list
            key={i}
            className={`pond-mote pond-mote--${spot}`}
            style={{
              left,
              width: size,
              height: spot === "sewer" ? size * 4 : size,
              animationDelay: delay,
              animationDuration: duration,
            }}
          />
        );
      })}
    </div>
  );
}
