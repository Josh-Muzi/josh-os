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
  "flex w-full min-w-0 items-center gap-1.5 border-0 bg-transparent px-2 py-1.5 text-left text-sm shadow-none hover:bg-[#000080] hover:text-white";

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
        aria-label="Close Start menu"
        onClick={onClose}
        className="absolute inset-0 z-[9998] h-full w-full min-w-0 cursor-default border-0 bg-transparent p-0 shadow-none"
      />
      <nav
        aria-label="Start menu"
        className="window absolute bottom-0 left-1 z-[9999] w-56 p-1"
      >
        <p className="m-0 bg-[#000080] px-2 py-1 text-sm font-bold text-white">
          JoshOS 1.0
        </p>
        <ul className="m-0 list-none p-0">
          {APPS.map((app) => {
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
        <hr />
        <button type="button" className={itemClasses} onClick={onSwitchToPlain}>
          <GlobeIcon size={16} />
          <span>Switch to website mode</span>
        </button>
      </nav>
    </>
  );
}
