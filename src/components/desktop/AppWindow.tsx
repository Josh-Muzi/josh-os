"use client";

import type { ReactNode } from "react";
import { Rnd } from "react-rnd";
import type { AppDefinition } from "./apps";
import { type ManagedWindow, useWindowActions } from "./WindowManager";

interface AppWindowProps {
  app: AppDefinition;
  win: ManagedWindow;
  focused: boolean;
  children: ReactNode;
}

export function AppWindow({ app, win, focused, children }: AppWindowProps) {
  const { close, focus, minimize, move, resize, toggleMaximize } =
    useWindowActions();

  return (
    <Rnd
      bounds="parent"
      minWidth={300}
      minHeight={200}
      position={win.maximized ? { x: 0, y: 0 } : { x: win.x, y: win.y }}
      size={
        win.maximized
          ? { width: "100%", height: "100%" }
          : { width: win.width, height: win.height }
      }
      disableDragging={win.maximized}
      enableResizing={!win.maximized}
      dragHandleClassName="title-bar"
      style={{ zIndex: win.z, display: win.minimized ? "none" : undefined }}
      className="window"
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
      <section
        aria-label={`${app.title} window`}
        className="flex h-full flex-col"
      >
        <div className={focused ? "title-bar" : "title-bar inactive"}>
          <div className="title-bar-text">{app.title}</div>
          <div className="title-bar-controls">
            <button
              type="button"
              aria-label="Minimize"
              onClick={() => minimize(win.appId)}
            />
            <button
              type="button"
              aria-label={win.maximized ? "Restore" : "Maximize"}
              onClick={() => toggleMaximize(win.appId)}
            />
            <button
              type="button"
              aria-label="Close"
              onClick={() => close(win.appId)}
            />
          </div>
        </div>
        <div
          className="window-body flex-1 overflow-auto p-3"
          style={{ margin: 0 }}
        >
          {children}
        </div>
      </section>
    </Rnd>
  );
}
