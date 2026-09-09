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
import wallpaper from "./wallpaper.jpg";

interface DesktopProps {
  onSwitchToPlain: () => void;
}

/** Bottom-right corner, above the taskbar — the Compost Bin's home. */
function compostHome() {
  return { x: window.innerWidth - 104, y: window.innerHeight - 192 };
}

const ICON_TOP = 16;
const ICON_STEP_Y = 92;
const ICON_STEP_X = 96;
const TASKBAR_H = 48;
/** SSR-safe default; the mount effect re-homes with the real height. */
const DEFAULT_ROWS = 6;

/** How many icons fit in one column above the taskbar. */
function rowsPerColumn() {
  if (typeof window === "undefined") return DEFAULT_ROWS;
  const usable = window.innerHeight - TASKBAR_H - ICON_TOP - 12;
  return Math.max(1, Math.floor(usable / ICON_STEP_Y));
}

/**
 * Home position for each icon. Apps declare a desktop column (0 =
 * portfolio, 1 = games, right of About Me); within a column, icons
 * stack top-down and wrap before they'd collide with the taskbar.
 * The Compost Bin lives bottom-right and takes no column slot.
 */
function iconHome(app: AppDefinition, rows = rowsPerColumn(), ssr = false) {
  if (app.id === "compost") {
    return ssr || typeof window === "undefined"
      ? { x: 16, y: 16 }
      : compostHome();
  }
  const column = app.desktopColumn ?? 0;
  const siblings = APPS.filter(
    (a) => a.id !== "compost" && (a.desktopColumn ?? 0) === column,
  );
  const slot = siblings.findIndex((a) => a.id === app.id);
  // Overflow within a declared column wraps to the next column over.
  const col = column + Math.floor(slot / rows);
  const row = slot % rows;
  return { x: 16 + col * ICON_STEP_X, y: ICON_TOP + row * ICON_STEP_Y };
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
    // Deterministic on server and first client render (no window
    // access) so hydration matches; the effect below re-homes.
    Object.fromEntries(
      APPS.map((app) => [app.id, iconHome(app, DEFAULT_ROWS, true)]),
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

  // Re-home every icon the user hasn't moved, on mount (real viewport
  // height) and whenever the window resizes.
  useEffect(() => {
    const rehome = () => {
      const rows = rowsPerColumn();
      setIconPositions((positions) => {
        const next = { ...positions };
        for (const app of APPS) {
          if (!userMoved.current.has(app.id)) {
            next[app.id] = iconHome(app, rows);
          }
        }
        return next;
      });
    };
    rehome();
    window.addEventListener("resize", rehome);
    return () => window.removeEventListener("resize", rehome);
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
        // Meadow diorama wallpaper (Josh's generated art); the gradient
        // remains beneath as a fallback while the image loads.
        background: `url(${wallpaper.src}) center / cover no-repeat, linear-gradient(180deg, #ACC99C 0%, #9CBF87 100%)`,
      }}
    >
      {isMobile ? (
        <div className="grid grid-cols-4 justify-items-center gap-y-3 p-4 pt-6">
          {APPS.map((app) => (
            <DesktopIcon key={app.id} app={app} onOpen={() => open(app.id)} />
          ))}
        </div>
      ) : (
        APPS.map((app) => (
          <Rnd
            key={app.id}
            bounds="parent"
            enableResizing={false}
            position={iconPositions[app.id] ?? iconHome(app)}
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
