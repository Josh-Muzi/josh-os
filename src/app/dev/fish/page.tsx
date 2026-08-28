"use client";

/**
 * Dev-only fish gallery: /dev/fish
 * Not linked from anywhere. For tuning the generator by eye.
 */
import { useState } from "react";
import { FishSprite } from "@/games/pond/sprite/FishSprite";
import type { FishVariant } from "@/games/pond/sprite/palette";

// "glitched" exists in the sprite layer but is shelved by design decision.
const VARIANTS: FishVariant[] = ["normal", "golden"];

export default function FishGalleryPage() {
  const [batch, setBatch] = useState(0);
  const [variant, setVariant] = useState<FishVariant>("normal");
  const seeds = Array.from({ length: 24 }, (_, i) => `dev:${batch}:${i}`);

  return (
    <main style={{ padding: 24, background: "#0e2233", minHeight: "100vh" }}>
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button type="button" onClick={() => setBatch((b) => b + 1)}>
          Reroll batch
        </button>
        {VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVariant(v)}
            style={{ fontWeight: v === variant ? "bold" : "normal" }}
          >
            {v}
          </button>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, max-content)",
          gap: 16,
        }}
      >
        {seeds.map((seed) => (
          <div key={seed} style={{ background: "#123", padding: 8 }}>
            <FishSprite seed={seed} variant={variant} scale={5} />
            <div style={{ color: "#9cc", fontSize: 11 }}>{seed}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
