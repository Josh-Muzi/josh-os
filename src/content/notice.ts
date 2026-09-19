import type { Notice } from "./types";

/** ISO 8601 date-time ending in "Z" or a "±HH:MM" offset: an absolute instant. */
const HAS_UTC_OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/i;

/**
 * Whether a notice should be shown at `now`. Pure so the server (static
 * HTML) and the browser agree. `expires` is an absolute instant, so every
 * visitor sees it end at the same moment regardless of their time zone.
 * An unparseable date, or one without a UTC offset, fails closed: no
 * notice beats a stale one, and without an offset `Date.parse` reads
 * local time, so the server (UTC) and a visitor's browser would disagree.
 */
export function isNoticeLive(notice: Notice | undefined, now: Date): boolean {
  if (!notice?.enabled) return false;
  if (!HAS_UTC_OFFSET.test(notice.expires)) return false;
  const expires = Date.parse(notice.expires);
  return Number.isFinite(expires) && now.getTime() <= expires;
}

/** Identifies one announcement, so a dismissal never hides the next one. */
export function noticeKey(notice: Notice): string {
  return `${notice.expires}|${notice.label}|${notice.text}`;
}
