"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { APPS, type AppId } from "./apps";

/**
 * Stacking contract for the desktop:
 * icons sit at z=5 (Desktop.tsx), every window renders at
 * WINDOW_LAYER_BASE + win.z so even the first window of a session
 * (z=1) stacks above icons, and the taskbar/start menu live at
 * z=9000+. Window z values only compete with each other.
 */
export const WINDOW_LAYER_BASE = 10;

export interface ManagedWindow {
  appId: AppId;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
}

interface WindowsState {
  windows: ManagedWindow[];
  nextZ: number;
}

type WindowsAction =
  | { type: "OPEN"; appId: AppId }
  | { type: "CLOSE"; appId: AppId }
  | { type: "FOCUS"; appId: AppId }
  | { type: "MINIMIZE"; appId: AppId }
  | { type: "TOGGLE_MAXIMIZE"; appId: AppId }
  | { type: "MOVE"; appId: AppId; x: number; y: number }
  | {
      type: "RESIZE";
      appId: AppId;
      x: number;
      y: number;
      width: number;
      height: number;
    };

const initialState: WindowsState = { windows: [], nextZ: 1 };

function patch(
  state: WindowsState,
  appId: AppId,
  changes: Partial<ManagedWindow>,
): WindowsState {
  return {
    ...state,
    windows: state.windows.map((win) =>
      win.appId === appId ? { ...win, ...changes } : win,
    ),
  };
}

function reducer(state: WindowsState, action: WindowsAction): WindowsState {
  switch (action.type) {
    case "OPEN": {
      const existing = state.windows.find((w) => w.appId === action.appId);
      if (existing) {
        // De-dupe: re-opening an app focuses its existing window.
        return {
          ...patch(state, action.appId, { minimized: false, z: state.nextZ }),
          nextZ: state.nextZ + 1,
        };
      }
      const app = APPS.find((a) => a.id === action.appId);
      if (!app) return state;
      const offset = (state.windows.length % 5) * 28;
      const win: ManagedWindow = {
        appId: action.appId,
        x: 96 + offset,
        y: 48 + offset,
        width: app.defaultSize.width,
        height: app.defaultSize.height,
        z: state.nextZ,
        minimized: false,
        maximized: false,
      };
      return { windows: [...state.windows, win], nextZ: state.nextZ + 1 };
    }
    case "CLOSE":
      return {
        ...state,
        windows: state.windows.filter((w) => w.appId !== action.appId),
      };
    case "FOCUS":
      return {
        ...patch(state, action.appId, { minimized: false, z: state.nextZ }),
        nextZ: state.nextZ + 1,
      };
    case "MINIMIZE":
      return patch(state, action.appId, { minimized: true });
    case "TOGGLE_MAXIMIZE": {
      const win = state.windows.find((w) => w.appId === action.appId);
      if (!win) return state;
      return {
        ...patch(state, action.appId, {
          maximized: !win.maximized,
          minimized: false,
          z: state.nextZ,
        }),
        nextZ: state.nextZ + 1,
      };
    }
    case "MOVE":
      return patch(state, action.appId, { x: action.x, y: action.y });
    case "RESIZE":
      return patch(state, action.appId, {
        x: action.x,
        y: action.y,
        width: action.width,
        height: action.height,
      });
    default:
      return state;
  }
}

const WindowsContext = createContext<WindowsState | null>(null);
const WindowsDispatchContext = createContext<Dispatch<WindowsAction> | null>(
  null,
);

export function WindowsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <WindowsContext.Provider value={state}>
      <WindowsDispatchContext.Provider value={dispatch}>
        {children}
      </WindowsDispatchContext.Provider>
    </WindowsContext.Provider>
  );
}

export function useWindows(): WindowsState {
  const state = useContext(WindowsContext);
  if (!state) {
    throw new Error("useWindows must be used inside WindowsProvider");
  }
  return state;
}

/** Highest z among visible windows; 0 when none are visible. */
export function topZ(windows: ManagedWindow[]): number {
  let top = 0;
  for (const win of windows) {
    if (!win.minimized && win.z > top) top = win.z;
  }
  return top;
}

export function useWindowActions() {
  const dispatch = useContext(WindowsDispatchContext);
  if (!dispatch) {
    throw new Error("useWindowActions must be used inside WindowsProvider");
  }
  return useMemo(
    () => ({
      open: (appId: AppId) => dispatch({ type: "OPEN", appId }),
      close: (appId: AppId) => dispatch({ type: "CLOSE", appId }),
      focus: (appId: AppId) => dispatch({ type: "FOCUS", appId }),
      minimize: (appId: AppId) => dispatch({ type: "MINIMIZE", appId }),
      toggleMaximize: (appId: AppId) =>
        dispatch({ type: "TOGGLE_MAXIMIZE", appId }),
      move: (appId: AppId, x: number, y: number) =>
        dispatch({ type: "MOVE", appId, x, y }),
      resize: (
        appId: AppId,
        x: number,
        y: number,
        width: number,
        height: number,
      ) => dispatch({ type: "RESIZE", appId, x, y, width, height }),
    }),
    [dispatch],
  );
}
