"use client";

import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { AppContent } from "./AppContent";
import { AppWindow } from "./AppWindow";
import { APPS, type AppDefinition, type AppId } from "./apps";
import { DesktopIcon } from "./DesktopIcon";
import { StartMenu } from "./StartMenu";
import { Taskbar } from "./Taskbar";
import {
  topZ,
  useWindowActions,
  useWindows,
  WindowsProvider,
} from "./WindowManager";

interface DesktopProps {
  onSwitchToPlain: () => void;
}

/** Bottom-right corner, above the taskbar — the Compost Bin's home. */
function compostHome() {
  return { x: window.innerWidth - 104, y: window.innerHeight - 192 };
}

/** Home position for each icon; state resets here on every page load. */
function iconHome(app: AppDefinition, index: number) {
  if (app.id === "compost" && typeof window !== "undefined") {
    return compostHome();
  }
  return { x: 16, y: 16 + index * 92 };
}

export function Desktop({ onSwitchToPlain }: DesktopProps) {
  return (
    <WindowsProvider>
      <DesktopInner onSwitchToPlain={onSwitchToPlain} />
    </WindowsProvider>
  );
}

function DesktopInner({ onSwitchToPlain }: DesktopProps) {
  const { windows } = useWindows();
  const { open } = useWindowActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [iconPositions, setIconPositions] = useState(() =>
    Object.fromEntries(
      APPS.map((app, index) => [app.id, iconHome(app, index)]),
    ),
  );
  // Distinguishes a real drag from a click so dragging never opens a window.
  const dragState = useRef({ startX: 0, startY: 0, moved: false });
  // Icons the user has moved keep their spot; untouched ones can re-home.
  const userMoved = useRef(new Set<AppId>());

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (userMoved.current.has("compost")) return;
      setIconPositions((positions) => ({
        ...positions,
        compost: compostHome(),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const top = topZ(windows);

  const handleOpen = (appId: AppId) => {
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    open(appId);
  };

  return (
    <div
      className="relative h-dvh overflow-hidden select-none"
      style={{
        background: "linear-gradient(180deg, #ACC99C 0%, #9CBF87 100%)",
      }}
    >
      {isMobile ? (
        <div className="grid grid-cols-4 justify-items-center gap-y-3 p-4 pt-6">
          {APPS.map((app) => (
            <DesktopIcon key={app.id} app={app} onOpen={() => open(app.id)} />
          ))}
        </div>
      ) : (
        APPS.map((app, index) => (
          <Rnd
            key={app.id}
            bounds="parent"
            enableResizing={false}
            position={iconPositions[app.id] ?? iconHome(app, index)}
            // Icon layer: z=5, always under windows (WINDOW_LAYER_BASE=10).
            style={{ zIndex: 5 }}
            onDragStart={(_event, data) => {
              dragState.current = {
                startX: data.x,
                startY: data.y,
                moved: false,
              };
            }}
            onDragStop={(_event, data) => {
              const distance =
                Math.abs(data.x - dragState.current.startX) +
                Math.abs(data.y - dragState.current.startY);
              if (distance > 6) {
                dragState.current.moved = true;
                userMoved.current.add(app.id);
                setIconPositions((positions) => ({
                  ...positions,
                  [app.id]: { x: data.x, y: data.y },
                }));
              }
            }}
          >
            <DesktopIcon app={app} onOpen={() => handleOpen(app.id)} />
          </Rnd>
        ))
      )}
      {windows.map((win) => {
        const app = APPS.find((a) => a.id === win.appId);
        if (!app) return null;
        return (
          <AppWindow
            key={win.appId}
            app={app}
            win={win}
            focused={win.z === top && !win.minimized}
            isMobile={isMobile}
          >
            <AppContent appId={win.appId} />
          </AppWindow>
        );
      })}
      {menuOpen && (
        <StartMenu
          onClose={() => setMenuOpen(false)}
          onOpenApp={(id: AppId) => {
            open(id);
            setMenuOpen(false);
          }}
          onSwitchToPlain={onSwitchToPlain}
        />
      )}
      <Taskbar
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
      />
    </div>
  );
}
