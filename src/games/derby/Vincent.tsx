"use client";

import vincentPortrait from "./sprite/vincent.png";
/**
 * Vincent — the loan shark. A pinstripe-suit mobster who lends money
 * at the track. The bailout is free; what escalates is his memory.
 * Lines cap at the 5th visit (per Josh) and repeat thereafter — and
 * from the 5th visit on he wears the sunglasses (business partners).
 */
import vincentAlt from "./sprite/vincent-alt.png";

export const SHARK_BAILOUT = 100;
/** Vincent shows up when you can't make a meaningful bet. */
export const SHARK_THRESHOLD = 50;

const LINES = [
  "Rough day at the track. Here's a hundred. We'll talk.",
  "Again. Here's a hundred. I'm writing this down.",
  "You have a page now.",
  "Two pages. I had to buy a second notebook.",
  "We're business partners now. Bad ones. There's a pond, you know.",
];

/** Line for the Nth visit (1-based); the 5th line is the cap. */
export function vincentLine(visit: number): string {
  return LINES[Math.min(Math.max(visit, 1), LINES.length) - 1];
}

function VincentPortrait({ visit }: { visit: number }) {
  const src = visit >= LINES.length ? vincentAlt.src : vincentPortrait.src;
  return (
    // biome-ignore lint/performance/noImgElement: pixel art needs raw img + pixelated scaling
    <img
      src={src}
      width={96}
      height={96}
      alt="Vincent, a man in the lending business"
      style={{ imageRendering: "pixelated", flexShrink: 0 }}
    />
  );
}

const BTN: React.CSSProperties = {
  background: "#e6e3da",
  border: "2px outset #fbfaf6",
  padding: "4px 14px",
  cursor: "pointer",
  color: "#2b2b27",
  fontWeight: 700,
};

export function VincentDialog({
  visit,
  onAccept,
  onDismiss,
}: {
  /** Which visit this would be (1-based). */
  visit: number;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "rgba(0,0,0,0.25)",
        zIndex: 5,
      }}
    >
      <div
        style={{
          width: 340,
          background: "#e6e3da",
          border: "2px outset #fbfaf6",
          boxShadow: "4px 4px 0 rgba(0,0,0,0.35)",
          fontSize: 13,
          color: "#2b2b27",
        }}
      >
        <div
          style={{
            background: "#3b3b36",
            color: "#f4f1ea",
            padding: "3px 8px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span>VINCENT.EXE</span>
          <button
            type="button"
            onClick={onDismiss}
            title="Not now"
            style={{ ...BTN, marginLeft: "auto", padding: "0 6px" }}
          >
            ×
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, padding: 12 }}>
          <VincentPortrait visit={visit} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              A message from Vincent
            </div>
            <div>{vincentLine(visit)}</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 6,
            padding: "0 12px 12px",
          }}
        >
          <button
            type="button"
            onClick={onDismiss}
            style={{ ...BTN, fontWeight: 400 }}
          >
            Not now
          </button>
          <button type="button" onClick={onAccept} style={BTN}>
            TAKE THE MONEY
          </button>
        </div>
      </div>
    </div>
  );
}
