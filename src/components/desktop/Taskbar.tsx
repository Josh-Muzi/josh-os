"use client";

import { useEffect, useState } from "react";
import { APPS } from "./apps";
import { topZ, useWindowActions, useWindows } from "./WindowManager";

interface TaskbarProps {
  startOpen: boolean;
  onToggleStart: () => void;
}

export function Taskbar({ startOpen, onToggleStart }: TaskbarProps) {
  const { windows } = useWindows();
  const { focus, minimize } = useWindowActions();
  const top = topZ(windows);

  return (
    <footer
      className="flex h-11 shrink-0 items-center gap-1 px-1"
      style={{ background: "#c0c0c0", borderTop: "2px solid #fff" }}
    >
      <button
        type="button"
        onClick={onToggleStart}
        aria-expanded={startOpen}
        className="font-bold"
        style={{ minWidth: 64 }}
      >
        🌱 Start
      </button>
      <div aria-hidden className="mx-1 h-8 w-px bg-neutral-400" />
      <div className="flex min-w-0 flex-1 gap-1">
        {windows.map((win) => {
          const app = APPS.find((a) => a.id === win.appId);
          if (!app) return null;
          const isTop = win.z === top && !win.minimized;
          return (
            <button
              key={win.appId}
              type="button"
              aria-pressed={isTop}
              onClick={() => (isTop ? minimize(win.appId) : focus(win.appId))}
              className="max-w-40 truncate text-left"
              style={{ minWidth: 120, fontWeight: isTop ? 700 : 400 }}
            >
              {app.emoji} {app.title}
            </button>
          );
        })}
      </div>
      <Clock />
    </footer>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div
      className="px-3 py-1 text-sm"
      style={{ boxShadow: "inset 1px 1px #808080, inset -1px -1px #fff" }}
    >
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </div>
  );
}
