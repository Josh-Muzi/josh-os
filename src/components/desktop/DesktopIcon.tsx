"use client";

import type { AppDefinition } from "./apps";

export function DesktopIcon({
  app,
  onOpen,
}: {
  app: AppDefinition;
  onOpen: () => void;
}) {
  const Icon = app.icon;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-20 flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-white/20 focus-visible:bg-white/25 focus-visible:outline-none"
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
