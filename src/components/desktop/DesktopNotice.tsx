"use client";

import { useEffect, useState } from "react";
import { type Notice, noticeKey, profile } from "@/content";
import { useNoticeLive } from "../notice/useNoticeLive";

const DISMISSED_KEY = "joshos:notice-dismissed";

type DesktopNotice =
  | { visible: true; notice: Notice; dismiss: () => void }
  | { visible: false };

/**
 * The desktop's view of `profile.notice`: live (enabled, not expired) and
 * not yet dismissed by this visitor. The desktop is client-only, so it
 * starts hidden and appears once storage has been read — no flash for
 * visitors who already closed it.
 */
export function useDesktopNotice(): DesktopNotice {
  const notice = profile.notice;
  const live = useNoticeLive(notice, false);
  const key = notice ? noticeKey(notice) : "";
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISSED_KEY) === key);
    } catch {
      // Storage blocked: show the note; it just won't stay dismissed.
      setDismissed(false);
    }
  }, [key]);

  if (!notice || !live || dismissed) return { visible: false };

  return {
    visible: true,
    notice,
    dismiss: () => {
      setDismissed(true);
      try {
        window.localStorage.setItem(DISMISSED_KEY, key);
      } catch {
        // Storage blocked/full: dismissed for this visit only.
      }
    },
  };
}

/**
 * A note pinned to the wallpaper — never a gate. It sits above the icons
 * and under any open window: top-right on desktop, docked above the
 * taskbar on phones (where the icon grid owns the top of the screen).
 * On a short phone screen there's no room that doesn't cover icons, so
 * the phone layout hides it; boring mode still carries it. (A landscape
 * phone is wider than the mobile breakpoint and gets the desktop layout,
 * where the top-right corner is clear of the icon columns.)
 */
export function NoticeWidget({
  notice,
  isMobile,
  onClose,
}: {
  notice: Notice;
  isMobile: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      aria-label="Announcement"
      className={`absolute rounded-xl border border-black/10 bg-white/92 p-4 text-neutral-800 shadow-lg backdrop-blur select-text ${
        isMobile
          ? "inset-x-3 bottom-[60px] [@media(max-height:560px)]:hidden"
          : "top-4 right-4 w-72"
      }`}
      // Above icons (5), below the marquee (8) and windows (10+).
      style={{ zIndex: 6 }}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <p className="flex-1 text-xs font-medium tracking-wide text-emerald-700 uppercase">
          {notice.label}
        </p>
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-sm leading-relaxed">{notice.text}</p>
      {notice.cta ? (
        <a
          href={notice.cta.href}
          className="mt-3 inline-block text-sm font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
        >
          {notice.cta.label} →
        </a>
      ) : null}
    </aside>
  );
}
