"use client";

import { useEffect } from "react";
import { LITE_EVENT, isLite } from "@/lib/lite";

/**
 * The runtime half: devices that report nothing (Safari, Firefox) or report
 * well but draw badly get measured. For about a second and a half after the
 * page settles it watches the frame rate; well under 30fps switches lite on
 * for this page and remembers it for the next ones.
 */
export default function PerfGuard() {
  useEffect(() => {
    if (isLite()) return;
    let raf = 0;
    let last = 0;
    const gaps: number[] = [];

    const tick = (t: number) => {
      if (document.hidden) {
        last = 0;
      } else {
        if (last) gaps.push(t - last);
        last = t;
      }
      if (gaps.length < 90) {
        raf = requestAnimationFrame(tick);
        return;
      }
      gaps.sort((a, b) => a - b);
      const median = gaps[gaps.length >> 1];
      if (median > 34) {
        document.documentElement.classList.add("lite");
        try {
          localStorage.setItem("vidmar-lite", "1");
        } catch {}
        window.dispatchEvent(new Event(LITE_EVENT));
      }
    };

    // the hero's intro runs for the first two seconds; measure through it,
    // that is exactly the work a slow machine chokes on
    const start = window.setTimeout(() => (raf = requestAnimationFrame(tick)), 600);
    return () => {
      clearTimeout(start);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
