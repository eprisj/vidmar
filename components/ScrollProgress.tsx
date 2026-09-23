"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  [key: `data-${string}`]: string | undefined;
};

/**
 * Writes how far a section has travelled through the viewport into CSS:
 * --p runs 0 → 1 from the moment its top enters at the bottom of the screen
 * until its bottom leaves at the top; --in runs 0 → 1 over the first third,
 * for things that should settle as the section arrives.
 */
export default function ScrollProgress({ children, className = "", as: Tag = "section", ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "0.5");
      el.style.setProperty("--in", "1");
      return;
    }

    // The values ease toward the scroll position instead of snapping to it.
    // Bound 1:1, every wheel notch and every throttled touch-scroll event on
    // iOS landed as a visible jolt of the ring; eased, it turns like
    // something with weight and keeps turning a moment after the hand stops.
    let raf = 0;
    let p = -1;
    let settle = -1;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      return {
        p: Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))),
        settle: Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75))),
      };
    };
    const write = () => {
      el.style.setProperty("--p", p.toFixed(4));
      el.style.setProperty("--in", settle.toFixed(4));
    };
    const update = () => {
      raf = 0;
      const t = measure();
      if (p < 0) {
        p = t.p;
        settle = t.settle;
      } else {
        p += (t.p - p) * 0.12;
        settle += (t.settle - settle) * 0.12;
      }
      write();
      if (Math.abs(t.p - p) > 0.0005 || Math.abs(t.settle - settle) > 0.0005) {
        raf = requestAnimationFrame(update);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
