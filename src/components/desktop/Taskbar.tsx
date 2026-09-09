"use client";

import { useEffect, useState } from "react";
import { APPS } from "./apps";
import { SproutIcon } from "./icons";
import { topZ, useWindowActions, useWindows } from "./WindowManager";

interface TaskbarProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
}

/** Modern taskbar: frosted dark glass over the wallpaper — menu, window pills, clock. */
export function Taskbar({ menuOpen, onToggleMenu }: TaskbarProps) {
  const { windows } = useWindows();
  const { focus, minimize } = useWindowActions();
  const top = topZ(windows);

  return (
    <div className="absolute inset-x-0 bottom-0 z-[9000] flex h-12 items-center gap-1.5 border-t border-white/15 bg-[#1c2618]/55 px-2 text-white backdrop-blur-md">
      <button
        type="button"
        aria-label="Open JoshOS menu"
        aria-expanded={menuOpen}
        onClick={onToggleMenu}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          menuOpen ? "bg-white/25" : "hover:bg-white/15"
        }`}
      >
        <SproutIcon size={18} />
      </button>
      <div aria-hidden className="mx-0.5 h-6 w-px shrink-0 bg-white/20" />
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {windows.map((win) => {
          const app = APPS.find((a) => a.id === win.appId);
          if (!app) return null;
          const Icon = app.icon;
          const isTop = win.z === top && !win.minimized;
          return (
            <button
              key={win.appId}
              type="button"
              aria-pressed={isTop}
              onClick={() => (isTop ? minimize(win.appId) : focus(win.appId))}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
                isTop
                  ? "bg-white/25 font-medium text-white"
                  : "text-white/80 hover:bg-white/15"
              }`}
            >
              <Icon size={16} />
              <span className="hidden max-w-28 truncate sm:inline">
                {app.label}
              </span>
            </button>
          );
        })}
      </div>
      <Clock />
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="shrink-0 px-2 text-sm text-white/85 tabular-nums">
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}
