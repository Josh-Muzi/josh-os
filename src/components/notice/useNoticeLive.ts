"use client";

import { useEffect, useState } from "react";
import { isNoticeLive, type Notice } from "@/content";

/**
 * `initial` must equal what the server rendered (see app/page.tsx) so
 * hydration matches; the effect then corrects for time passed since the
 * HTML was generated.
 */
export function useNoticeLive(notice: Notice | undefined, initial: boolean) {
  const [live, setLive] = useState(initial);

  useEffect(() => {
    setLive(isNoticeLive(notice, new Date()));
  }, [notice]);

  return live;
}
