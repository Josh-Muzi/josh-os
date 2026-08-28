"use client";

/**
 * FISHDEX.DAT — the collection panel. Species sorted rarest-first,
 * then newest; lifetime records along the bottom.
 */
import { sellPrice } from "./rarity";
import { FishSprite } from "./sprite/FishSprite";
import type { DexEntry, PondRecords } from "./storage";
import type { Rarity } from "./types";
import { RARITY_LABEL } from "./types";

const RARITY_ORDER: Record<Rarity, number> = {
  anomaly: 0,
  legendary: 1,
  rare: 2,
  uncommon: 3,
  common: 4,
};

const RARITY_COLOR: Record<Rarity, string> = {
  common: "#3b3b36",
  uncommon: "#1b6b2e",
  rare: "#3b6ea5",
  legendary: "#a5307a",
  anomaly: "#008080",
};

export function DexPanel({
  dex,
  records,
}: {
  dex: Record<string, DexEntry>;
  records: PondRecords;
}) {
  const entries = Object.values(dex).sort(
    (a, b) =>
      RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] ||
      b.firstCaughtAt - a.firstCaughtAt,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "2px inset #808080",
          background: "#fff",
          padding: 4,
        }}
      >
        {entries.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
            The FishDex is empty. Catch something.
          </div>
        )}

        {entries.map((entry) => (
          <div
            key={entry.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 6px",
              borderBottom: "1px solid #ddd",
            }}
          >
            <FishSprite
              seed={entry.seed}
              hueOverride={entry.hue}
              variant={entry.goldenCount > 0 ? "golden" : "normal"}
              scale={2}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {entry.name}
                {entry.goldenCount > 0 && (
                  <span title={`${entry.goldenCount} golden caught`}> ★</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#555" }}>
                <span
                  style={{ color: RARITY_COLOR[entry.rarity], fontWeight: 700 }}
                >
                  {RARITY_LABEL[entry.rarity]}
                </span>
                {" · "}x{entry.count} · best {entry.bestSizeCm} cm · sells ~J$
                {sellPrice(entry.rarity, entry.bestSizeCm, "normal")}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, paddingTop: 4 }}>
        Species: {entries.length} · Catches: {records.catches} · Goldens:{" "}
        {records.goldens} · Biggest: {records.bestSizeCm} cm · Casts:{" "}
        {records.casts}
      </div>
    </div>
  );
}
