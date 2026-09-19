"use client";

import { useEffect, useState } from "react";
import { isNoticeLive, type Notice } from "@/content";

/**
 * `initial` must equal what the server rendered (see app/page.tsx) so
 * hydration matches; the effect then corrects for time passed since the
 * HTML was generated, and flips the notice off at the expiry instant in a
 * tab left open.
 */
export function useNoticeLive(notice: Notice | undefined, initial: boolean) {
  const [live, setLive] = useState(initial);

  useEffect(() => {
    let timer: number | undefined;
    const check = () => {
      const now = new Date();
      const isLive = isNoticeLive(notice, now);
      setLive(isLive);
      if (!isLive || !notice) return;
      // setTimeout caps at 2^31-1 ms (~24.8 days); for a longer runway the
      // early wake-up simply re-checks and re-arms.
      const remaining = Date.parse(notice.expires) - now.getTime();
      timer = window.setTimeout(check, Math.min(remaining + 1, 2 ** 31 - 1));
    };
    check();
    return () => window.clearTimeout(timer);
  }, [notice]);

  return live;
}
