"use client";

import { useEffect } from "react";
import { APPS, type AppId } from "./apps";
import { GlobeIcon } from "./icons";

interface StartMenuProps {
  onClose: () => void;
  onOpenApp: (id: AppId) => void;
  onSwitchToPlain: () => void;
}

const itemClasses =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100";

export function StartMenu({
  onClose,
  onOpenApp,
  onSwitchToPlain,
}: StartMenuProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 z-[9400] h-full w-full cursor-default"
      />
      <nav
        aria-label="JoshOS menu"
        className="absolute bottom-14 left-2 z-[9500] w-60 rounded-2xl border border-black/10 bg-white p-1.5 shadow-xl"
      >
        <p className="px-2.5 py-1.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
          JoshOS
        </p>
        <ul className="m-0 list-none p-0">
          {APPS.filter((app) => app.inStartMenu !== false).map((app) => {
            const Icon = app.icon;
            return (
              <li key={app.id}>
                <button
                  type="button"
                  className={itemClasses}
                  onClick={() => onOpenApp(app.id)}
                >
                  <Icon size={16} />
                  <span>{app.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div aria-hidden className="my-1 border-t border-neutral-100" />
        <button type="button" className={itemClasses} onClick={onSwitchToPlain}>
          <GlobeIcon size={16} />
          <span>Switch to website mode</span>
        </button>
      </nav>
    </>
  );
}
