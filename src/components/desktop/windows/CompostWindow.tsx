"use client";

import { useState } from "react";

const INITIAL_ITEMS = [
  { name: "piano-app.zip", note: "composting since 2025" },
  { name: "tomato_defense_v1.txt", note: "superseded by metal cages" },
];

export function CompostWindow() {
  const [items, setItems] = useState(INITIAL_ITEMS);

  if (items.length === 0) {
    return <p>Nutrients returned to the soil.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs">{items.length} object(s) decomposing</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.name}>
            <span className="font-bold">{item.name}</span>{" "}
            <span className="text-xs">— {item.note}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setItems([])}>
        Empty Compost
      </button>
    </div>
  );
}
