"use client";

import type { ReactNode } from "react";
import { Rnd } from "react-rnd";
import type { AppDefinition } from "./apps";
import { type ManagedWindow, useWindowActions } from "./WindowManager";

interface AppWindowProps {
  app: AppDefinition;
  win: ManagedWindow;
  focused: boolean;
  isMobile: boolean;
  children: ReactNode;
}

const controlClasses =
  "flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800";

export function AppWindow({
  app,
  win,
  focused,
  isMobile,
  children,
}: AppWindowProps) {
  const { close, focus, minimize, move, resize, toggleMaximize } =
    useWindowActions();
  const Icon = app.icon;

  const chrome = (
    <section
      aria-label={`${app.title} window`}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-black/10 bg-white"
      style={{
        boxShadow: focused
          ? "0 16px 40px rgba(0,0,0,0.22)"
          : "0 8px 20px rgba(0,0,0,0.12)",
      }}
    >
      <header
        className={`app-window-titlebar flex items-center gap-2 border-b border-black/5 bg-white px-3 py-2 ${
          focused ? "" : "opacity-70"
        }`}
      >
        <Icon size={16} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">
          {app.title}
        </span>
        {!isMobile && (
          <button
            type="button"
            aria-label="Minimize"
            className={controlClasses}
            onClick={() => minimize(win.appId)}
          >
            –
          </button>
        )}
        {!isMobile && (
          <button
            type="button"
            aria-label={win.maximized ? "Restore" : "Maximize"}
            className={controlClasses}
            onClick={() => toggleMaximize(win.appId)}
          >
            □
          </button>
        )}
        <button
          type="button"
          aria-label="Close"
          className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => close(win.appId)}
        >
          ✕
        </button>
      </header>
      <div className="flex-1 overflow-auto p-4 text-sm text-neutral-800">
        {children}
      </div>
    </section>
  );

  if (isMobile) {
    // Phones: full-screen sheets above the icons, above the taskbar. Focus
    // changes happen via the taskbar, so no pointer handlers needed here.
    return (
      <div
        className="absolute inset-x-2 top-2 bottom-14"
        style={{ zIndex: win.z, display: win.minimized ? "none" : undefined }}
      >
        {chrome}
      </div>
    );
  }

  return (
    <Rnd
      bounds="parent"
      minWidth={300}
      minHeight={200}
      position={win.maximized ? { x: 0, y: 0 } : { x: win.x, y: win.y }}
      size={
        win.maximized
          ? { width: "100%", height: "calc(100% - 48px)" }
          : { width: win.width, height: win.height }
      }
      disableDragging={win.maximized}
      enableResizing={!win.maximized}
      dragHandleClassName="app-window-titlebar"
      style={{ zIndex: win.z, display: win.minimized ? "none" : undefined }}
      onMouseDown={() => focus(win.appId)}
      onDragStop={(_event, data) => move(win.appId, data.x, data.y)}
      onResizeStop={(_event, _direction, ref, _delta, position) =>
        resize(
          win.appId,
          position.x,
          position.y,
          ref.offsetWidth,
          ref.offsetHeight,
        )
      }
    >
      {chrome}
    </Rnd>
  );
}
