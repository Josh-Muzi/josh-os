"use client";

import "98.css";
import { useState } from "react";
import { AppContent } from "./AppContent";
import { AppWindow } from "./AppWindow";
import { APPS, type AppId } from "./apps";
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
  const [startOpen, setStartOpen] = useState(false);
  const top = topZ(windows);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <main
        className="relative flex-1 select-none overflow-hidden"
        style={{ background: "#0e7a5f" }}
      >
        <div className="absolute top-4 left-4 flex flex-col gap-4">
          {APPS.map((app) => (
            <DesktopIcon key={app.id} app={app} onOpen={() => open(app.id)} />
          ))}
        </div>
        {windows.map((win) => {
          const app = APPS.find((a) => a.id === win.appId);
          if (!app) return null;
          return (
            <AppWindow
              key={win.appId}
              app={app}
              win={win}
              focused={win.z === top && !win.minimized}
            >
              <AppContent appId={win.appId} />
            </AppWindow>
          );
        })}
        {startOpen && (
          <StartMenu
            onClose={() => setStartOpen(false)}
            onOpenApp={(id: AppId) => {
              open(id);
              setStartOpen(false);
            }}
            onSwitchToPlain={onSwitchToPlain}
          />
        )}
      </main>
      <Taskbar
        startOpen={startOpen}
        onToggleStart={() => setStartOpen((value) => !value)}
      />
    </div>
  );
}
