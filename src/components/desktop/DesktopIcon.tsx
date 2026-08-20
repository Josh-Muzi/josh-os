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
      className="flex w-20 min-w-0 flex-col items-center gap-1 border-0 bg-transparent p-1 shadow-none focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-white"
    >
      <Icon size={32} />
      <span className="text-xs text-white [text-shadow:1px_1px_0_rgba(0,0,0,0.8)]">
        {app.label}
      </span>
    </button>
  );
}
