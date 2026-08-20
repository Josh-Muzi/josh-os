"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PlainSite } from "./site/PlainSite";

// The desktop bundle (react-rnd, window manager) loads only when
// desktop mode engages — plain mode never pays for it.
const Desktop = dynamic(
  () => import("./desktop/Desktop").then((mod) => mod.Desktop),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-dvh items-center justify-center text-white"
        style={{ background: "#9cbf87" }}
      >
        <p>Starting JoshOS…</p>
      </div>
    ),
  },
);

type Mode = "plain" | "desktop";
const MODE_KEY = "joshos:mode";

export function Experience() {
  const [mode, setMode] = useState<Mode>("plain");

  useEffect(() => {
    const stored = window.localStorage.getItem(MODE_KEY);
    if (stored === "plain" || stored === "desktop") {
      setMode(stored);
      return;
    }
    // First visit: desktop mode only on wide screens with a real pointer.
    const capable = window.matchMedia(
      "(min-width: 1024px) and (pointer: fine)",
    ).matches;
    if (capable) setMode("desktop");
  }, []);

  const switchMode = (next: Mode) => {
    window.localStorage.setItem(MODE_KEY, next);
    setMode(next);
  };

  if (mode === "desktop") {
    return <Desktop onSwitchToPlain={() => switchMode("plain")} />;
  }

  return (
    <>
      <PlainSite />
      <button
        type="button"
        onClick={() => switchMode("desktop")}
        className="fixed top-4 right-4 z-50 rounded-full border border-emerald-800/20 bg-white/90 px-4 py-2 text-sm font-medium text-emerald-800 shadow-md backdrop-blur hover:bg-white"
      >
        Launch JoshOS →
      </button>
    </>
  );
}
