"use client";

import { useEffect } from "react";
import { LITE_EVENT, isLite } from "@/lib/lite";

/**
 * A faint warm glow that follows the pointer across any [data-candle]
 * section — the light of a candle carried through a dark room. The glow
 * itself is CSS (globals.css); this only feeds it the pointer position.
 */
export default function CandleLight() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // every move repaints a blended layer the size of the section
    if (!fine || reduced || isLite()) return;

    let raf = 0;
    let last: { el: HTMLElement; x: number; y: number } | null = null;

    const paint = () => {
      raf = 0;
      if (!last) return;
      const r = last.el.getBoundingClientRect();
      last.el.style.setProperty("--mx", `${last.x - r.left}px`);
      last.el.style.setProperty("--my", `${last.y - r.top}px`);
    };

    const move = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-candle]");
      if (!el) return;
      last = { el, x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const off = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener(LITE_EVENT, off);
    return () => {
      off();
      window.removeEventListener(LITE_EVENT, off);
    };
  }, []);

  return null;
}
