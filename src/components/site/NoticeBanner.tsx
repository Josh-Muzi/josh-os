"use client";

import type { Notice } from "@/content";
import { useNoticeLive } from "../notice/useNoticeLive";

// Time-boxed announcement for boring mode. A stale "I'm in town this
// weekend" is worse than no notice at all, so it hides itself on expiry.
export function NoticeBanner({
  notice,
  initiallyLive,
}: {
  notice: Notice;
  initiallyLive: boolean;
}) {
  const live = useNoticeLive(notice, initiallyLive);
  if (!live) return null;

  return (
    <aside
      aria-label="Announcement"
      className="mt-6 rounded-lg border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-900"
    >
      <p>
        {notice.text}
        {notice.cta ? (
          <>
            {" "}
            <a
              href={notice.cta.href}
              className="font-medium whitespace-nowrap text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
            >
              {notice.cta.label} →
            </a>
          </>
        ) : null}
      </p>
    </aside>
  );
}
