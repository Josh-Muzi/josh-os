"use client";

import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { AppContent } from "./AppContent";
import { AppWindow } from "./AppWindow";
import { APPS, type AppDefinition, type AppId } from "./apps";
import { DesktopIcon } from "./DesktopIcon";
import { NoticeWidget, useDesktopNotice } from "./DesktopNotice";
import { iconGrid } from "./iconLayout";
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
/** Rendered icon box (w-20 button + label), used for group-drag bounds. */
const ICON_BOX_W = 80;
const ICON_BOX_H = 84;
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
 * portfolio, 1 = games, right of About Me); see `iconGrid` for the flow,
 * wrap and `desktopBeside` rules. The Compost Bin lives bottom-right and
 * takes no grid cell.
 */
function iconHome(app: AppDefinition, rows = rowsPerColumn(), ssr = false) {
  if (app.id === "compost") {
    return ssr || typeof window === "undefined"
      ? { x: 16, y: 16 }
      : compostHome();
  }
  const grid = iconGrid(
    APPS.filter((a) => a.id !== "compost"),
    rows,
  );
  const cell = grid.get(app.id) ?? { col: 0, row: 0 };
  return {
    x: 16 + cell.col * ICON_STEP_X,
    y: ICON_TOP + cell.row * ICON_STEP_Y,
  };
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
  const notice = useDesktopNotice();
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

  // ---- Windows-style selection: marquee, highlight, group drag ----
  const rootRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Set<AppId>>(() => new Set());
  const [marquee, setMarquee] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  // Icons riding along with a dragged selected icon: the followers'
  // start positions (the leader's start lives in dragState).
  const groupDrag = useRef<{
    leader: AppId;
    starts: Record<string, { x: number; y: number }>;
  } | null>(null);
  // Per-drag bounding box for the LEADER icon, sized so that no member
  // of the group can leave the desktop or slide under the taskbar.
  // react-rnd measures its `bounds` element after calling onDragStart,
  // so resizing this div there makes the group rigid at the edges.
  // (Vetoing steps by returning false is NOT an option: react-draggable
  // treats that as "abort drag" and ends it with a synthetic mouseup at
  // (0,0), which flung icons into the top-left corner.)
  const dragBoundsRef = useRef<HTMLDivElement>(null);

  const toggleSelect = (appId: AppId) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(new Set());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** Which icons intersect a rectangle in desktop coordinates. */
  const iconsIn = (rect: { x: number; y: number; w: number; h: number }) => {
    const root = rootRef.current;
    if (!root) return new Set<AppId>();
    const origin = root.getBoundingClientRect();
    const hits = new Set<AppId>();
    for (const el of root.querySelectorAll<HTMLElement>("[data-icon-id]")) {
      const b = el.getBoundingClientRect();
      const left = b.left - origin.left;
      const topEdge = b.top - origin.top;
      const overlaps =
        left < rect.x + rect.w &&
        left + b.width > rect.x &&
        topEdge < rect.y + rect.h &&
        topEdge + b.height > rect.y;
      if (overlaps) hits.add(el.dataset.iconId as AppId);
    }
    return hits;
  };

  const onDesktopPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only a primary mouse/pen press directly on the wallpaper starts a
    // marquee. Icons, windows, taskbar and menu are their own targets;
    // the windows layer is pointer-transparent so empty space reaches us.
    if (isMobile || e.button !== 0 || e.pointerType === "touch") return;
    if (e.target !== e.currentTarget) return;
    const origin = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - origin.left;
    const y = e.clientY - origin.top;
    marqueeStart.current = { x, y };
    setMarquee({ x, y, w: 0, h: 0 });
    if (!(e.ctrlKey || e.metaKey)) setSelected(new Set());
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDesktopPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = marqueeStart.current;
    if (!start) return;
    const origin = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - origin.left;
    const cy = e.clientY - origin.top;
    const rect = {
      x: Math.min(start.x, cx),
      y: Math.min(start.y, cy),
      w: Math.abs(cx - start.x),
      h: Math.abs(cy - start.y),
    };
    setMarquee(rect);
    setSelected(iconsIn(rect));
  };

  const endMarquee = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!marqueeStart.current) return;
    marqueeStart.current = null;
    setMarquee(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleOpen = (appId: AppId) => {
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    setSelected(new Set([appId]));
    open(appId);
  };

  return (
    <div
      ref={rootRef}
      className="relative h-dvh overflow-hidden select-none"
      onPointerDown={onDesktopPointerDown}
      onPointerMove={onDesktopPointerMove}
      onPointerUp={endMarquee}
      onPointerCancel={endMarquee}
      style={{
        // Meadow diorama wallpaper (Josh's generated art); the gradient
        // remains beneath as a fallback while the image loads.
        background: `url(${wallpaper.src}) center / cover no-repeat, linear-gradient(180deg, #ACC99C 0%, #9CBF87 100%)`,
      }}
    >
      {/* Invisible per-drag bounds for icon dragging (see dragBoundsRef).
          Sized in onDragStart before react-rnd measures it. */}
      <div
        id="icon-drag-bounds"
        ref={dragBoundsRef}
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: `calc(100% - ${TASKBAR_H}px)`,
          pointerEvents: "none",
          visibility: "hidden",
        }}
      />
      {marquee && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: marquee.x,
            top: marquee.y,
            width: marquee.w,
            height: marquee.h,
            background: "rgba(0, 120, 215, 0.22)",
            border: "1px solid rgba(0, 120, 215, 0.9)",
            zIndex: 8, // above icons (5), below windows (10+)
            pointerEvents: "none",
          }}
        />
      )}
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
            bounds="#icon-drag-bounds"
            enableResizing={false}
            position={iconPositions[app.id] ?? iconHome(app)}
            // Icon layer: z=5, always under windows (WINDOW_LAYER_BASE=10).
            style={{ zIndex: 5 }}
            onDragStart={(event, data) => {
              dragState.current = {
                startX: data.x,
                startY: data.y,
                moved: false,
              };
              // Dragging a selected icon carries the whole selection;
              // dragging an unselected one selects it alone (Windows).
              // With Ctrl/Cmd held, leave the selection to the click
              // handler (it toggles) instead of replacing it here.
              const mouse = event as MouseEvent;
              const additive = mouse.ctrlKey || mouse.metaKey;
              const group = selected.has(app.id) ? selected : new Set([app.id]);
              if (!selected.has(app.id) && !additive) setSelected(group);
              const starts: Record<string, { x: number; y: number }> = {};
              for (const id of group) {
                if (id !== app.id) {
                  starts[id] =
                    iconPositions[id] ??
                    iconHome(APPS.find((a) => a.id === id) as AppDefinition);
                }
              }
              groupDrag.current = { leader: app.id, starts };

              // Size the leader's bounding box so the whole group stays
              // on the desktop: the leader may travel left only as far
              // as the leftmost member has room, right only as far as
              // the rightmost member has room, and so on.
              const root = rootRef.current;
              const box = dragBoundsRef.current;
              if (root && box) {
                const leaderEl = root.querySelector<HTMLElement>(
                  `[data-icon-id="${app.id}"]`,
                );
                const iconW = leaderEl?.offsetWidth ?? ICON_BOX_W;
                const iconH = leaderEl?.offsetHeight ?? ICON_BOX_H;
                const all = [
                  { x: data.x, y: data.y },
                  ...Object.values(starts),
                ];
                const minX = Math.min(...all.map((p) => p.x));
                const maxX = Math.max(...all.map((p) => p.x));
                const minY = Math.min(...all.map((p) => p.y));
                const maxY = Math.max(...all.map((p) => p.y));
                const limitX = root.clientWidth - iconW;
                const limitY = root.clientHeight - TASKBAR_H - iconH;
                const leaderMinX = data.x - minX;
                const leaderMaxX = data.x + (limitX - maxX);
                const leaderMinY = data.y - minY;
                const leaderMaxY = data.y + (limitY - maxY);
                box.style.left = `${leaderMinX}px`;
                box.style.top = `${leaderMinY}px`;
                box.style.width = `${Math.max(iconW, leaderMaxX - leaderMinX + iconW)}px`;
                box.style.height = `${Math.max(iconH, leaderMaxY - leaderMinY + iconH)}px`;
              }
            }}
            onDrag={(_event, data) => {
              const group = groupDrag.current;
              if (!group || Object.keys(group.starts).length === 0) return;
              // The leader is physically bounded (see onDragStart), so
              // followers can simply track the delta: nobody can leave.
              const dx = data.x - dragState.current.startX;
              const dy = data.y - dragState.current.startY;
              setIconPositions((positions) => {
                const next = { ...positions };
                for (const [id, start] of Object.entries(group.starts)) {
                  next[id] = { x: start.x + dx, y: start.y + dy };
                }
                return next;
              });
            }}
            onDragStop={(_event, data) => {
              const distance =
                Math.abs(data.x - dragState.current.startX) +
                Math.abs(data.y - dragState.current.startY);
              if (distance > 6) {
                dragState.current.moved = true;
                userMoved.current.add(app.id);
                for (const id of Object.keys(groupDrag.current?.starts ?? {})) {
                  userMoved.current.add(id as AppId);
                }
                setIconPositions((positions) => ({
                  ...positions,
                  [app.id]: { x: data.x, y: data.y },
                }));
              }
              groupDrag.current = null;
            }}
          >
            <DesktopIcon
              app={app}
              onOpen={() => handleOpen(app.id)}
              selected={selected.has(app.id)}
              onToggleSelect={() => toggleSelect(app.id)}
            />
          </Rnd>
        ))
      )}
      {/* Windows layer: ends above the taskbar, so react-rnd's
          bounds="parent" keeps windows off the bar and a maximized
          window fills exactly the space above it. pointer-events pass
          through the (empty) layer to the icons beneath. */}
      <div
        className="absolute inset-x-0 top-0 bottom-12"
        style={{ pointerEvents: "none" }}
      >
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
      </div>
      {notice.visible ? (
        <NoticeWidget
          notice={notice.notice}
          isMobile={isMobile}
          onClose={notice.dismiss}
        />
      ) : null}
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
