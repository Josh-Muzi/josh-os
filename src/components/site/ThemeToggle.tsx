"use client";

import { useEffect } from "react";
import { applyTheme, currentTheme, readStoredTheme, storeTheme } from "./theme";

/**
 * Light/dark switch for boring mode. Both icons are always in the DOM and
 * CSS picks one, so the markup is identical on the server and the client
 * whatever the theme — no hydration mismatch, no state to sync.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  // No stored choice: follow the OS if it changes while the tab is open.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = (e: MediaQueryListEvent) => {
      if (!readStoredTheme()) applyTheme(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = currentTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
        storeTheme(next);
      }}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-emerald-800/20 bg-white/90 text-emerald-800 shadow-md backdrop-blur hover:bg-white dark:border-emerald-400/20 dark:bg-neutral-900/90 dark:text-emerald-300 dark:hover:bg-neutral-800 ${className}`}
    >
      {/* Sun: shown in dark mode (click for light) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="hidden dark:block"
      >
        <title>Sun</title>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {/* Moon: shown in light mode (click for dark) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:hidden"
      >
        <title>Moon</title>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
