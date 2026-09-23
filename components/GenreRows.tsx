"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { showsNote, type Genre } from "@/lib/content";
import Atmosphere from "./Atmosphere";
import Seal from "./Seal";
import styles from "./GenreRows.module.css";

/**
 * The genre list, with a floating preview panel that trails the cursor while
 * a row is hovered — the way the reference previews its projects. Touch
 * devices and reduced-motion get the plain list.
 */
export default function GenreRows({ genres }: { genres: Genre[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduced);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = () => {
      // ease toward the pointer so the panel drifts rather than sticks
      pos.current.x += (target.current.x - pos.current.x) * 0.14;
      pos.current.y += (target.current.y - pos.current.y) * 0.14;
      if (panel.current) {
        panel.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(32px, -55%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, [enabled]);

  const current = active === null ? null : genres[active];

  return (
    <>
      <div className={styles.list} onPointerLeave={() => setActive(null)}>
        {genres.map((g, i) => (
          <Link
            key={g.slug}
            href={`/genres#${g.slug}`}
            className={`${styles.row} ${active === i ? styles.rowOn : ""}`}
            style={{ "--tint": g.tint } as CSSProperties}
            onPointerEnter={() => setActive(i)}
          >
            <span className={styles.title}>{g.title}</span>
            {showsNote(genres, i) && <span className="micro">{g.note}</span>}
            <span className={styles.bar} aria-hidden="true" />
          </Link>
        ))}
      </div>

      {enabled && (
        <div
          ref={panel}
          className={`${styles.panel} ${current ? styles.panelOn : ""}`}
          style={{ "--tint": current?.tint ?? "#161616" } as CSSProperties}
          aria-hidden="true"
        >
          <Atmosphere />
          <span className={styles.panelTint} />
          <span className={styles.panelSeal}>
            <Seal ticks={42} star={false} />
          </span>
          <span className={styles.panelTitle}>{current?.title}</span>
        </div>
      )}
    </>
  );
}
