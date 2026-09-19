"use client";

import { useState } from "react";
import type { Genre } from "@/lib/content";
import Reveal from "./Reveal";
import styles from "./CatalogGrid.module.css";

/**
 * The catalogue as it actually is right now: real, working filters over an
 * empty shelf. Each placeholder card carries the genre its eventual book
 * will belong to, so choosing a filter really does narrow the grid — there
 * is just nothing behind it yet. A dead filter bar over a static "soon"
 * message would have been dishonest about what's built; this is what ships
 * once the debut has a cover.
 */
export default function CatalogGrid({ genres }: { genres: Genre[] }) {
  const [active, setActive] = useState<string | null>(null);
  const shown = active ? genres.filter((g) => g.slug === active) : genres;

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Фільтр за напрямом">
        <button
          type="button"
          className={`${styles.chip} ${active === null ? styles.chipOn : ""}`}
          onClick={() => setActive(null)}
        >
          Усі напрями
        </button>
        {genres.map((g) => (
          <button
            key={g.slug}
            type="button"
            className={`${styles.chip} ${active === g.slug ? styles.chipOn : ""}`}
            style={{ "--tint": g.tint } as React.CSSProperties}
            onClick={() => setActive(g.slug)}
            aria-pressed={active === g.slug}
          >
            {g.title}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className={`body ${styles.none}`}>У цьому напрямі поки нічого не заплановано.</p>
      ) : (
        <div className={styles.grid}>
          {shown.map((g, i) => (
            <Reveal key={g.slug} delay={i * 60} className={styles.card} style={{ "--tint": g.tint } as React.CSSProperties}>
              <span className={styles.spine} aria-hidden="true" />
              <span className={styles.shimmer} aria-hidden="true" />
              <span className={styles.cardGenre}>{g.title}</span>
              <span className={`micro ${styles.cardState}`}>Готується</span>
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
