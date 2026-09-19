import type { Notice } from "./types";

/**
 * Whether a notice should be shown at `now`. Pure so the server (static
 * HTML) and the browser agree. `expires` is an absolute instant, so every
 * visitor sees it end at the same moment regardless of their time zone.
 * An unparseable date fails closed: no notice beats a stale one.
 */
export function isNoticeLive(notice: Notice | undefined, now: Date): boolean {
  if (!notice?.enabled) return false;
  const expires = Date.parse(notice.expires);
  return Number.isFinite(expires) && now.getTime() <= expires;
}

/** Identifies one announcement, so a dismissal never hides the next one. */
export function noticeKey(notice: Notice): string {
  return `${notice.expires}|${notice.label}|${notice.text}`;
}
