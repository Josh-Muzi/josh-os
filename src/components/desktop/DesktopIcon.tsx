"use client";

import type { AppDefinition } from "./apps";

export function DesktopIcon({
  app,
  onOpen,
  selected = false,
  onToggleSelect,
}: {
  app: AppDefinition;
  onOpen: () => void;
  /** Windows-style selection highlight (marquee or Ctrl+click). */
  selected?: boolean;
  /** Ctrl/Cmd+click toggles selection instead of opening. */
  onToggleSelect?: () => void;
}) {
  const Icon = app.icon;
  const highlight = selected
    ? "bg-[#0078d7]/25 ring-1 ring-[#0078d7]/60"
    : "hover:bg-white/20";
  return (
    <button
      type="button"
      data-icon-id={app.id}
      aria-pressed={selected}
      onClick={(e) => {
        if ((e.ctrlKey || e.metaKey) && onToggleSelect) {
          onToggleSelect();
          return;
        }
        onOpen();
      }}
      className={`flex w-20 flex-col items-center gap-1.5 rounded-xl p-2 focus-visible:bg-white/25 focus-visible:outline-none ${highlight}`}
    >
      <Icon size={32} />
      {/* Soft backing + stronger shadow keep labels readable over the
          busier edges of the meadow wallpaper. */}
      <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-xs font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
        {app.label}
      </span>
    </button>
  );
}
