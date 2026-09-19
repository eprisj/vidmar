"use client";

import { useEffect, useState } from "react";
import type { Genre } from "@/lib/content";
import { getBooks, type Book } from "@/lib/api";
import Reveal from "./Reveal";
import styles from "./CatalogGrid.module.css";

/**
 * The catalogue as it actually is right now: real, working filters over a
 * shelf that starts empty and fills in as books get published through the
 * admin API. Genres with no book yet keep the honest "Готується"
 * placeholder; genres with one get a real card instead.
 */
export default function CatalogGrid({ genres }: { genres: Genre[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    getBooks().then(setBooks);
  }, []);

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
          {shown.map((g, i) => {
            const genreBooks = books.filter((b) => b.genre_slug === g.slug);
            if (genreBooks.length === 0) {
              return (
                <Reveal
                  key={g.slug}
                  delay={i * 60}
                  className={styles.card}
                  style={{ "--tint": g.tint } as React.CSSProperties}
                >
                  <span className={styles.spine} aria-hidden="true" />
                  <span className={styles.shimmer} aria-hidden="true" />
                  <span className={styles.cardGenre}>{g.title}</span>
                  <span className={`micro ${styles.cardState}`}>Готується</span>
                </Reveal>
              );
            }
            return genreBooks.map((book, bi) => (
              <Reveal
                key={book.slug}
                delay={(i + bi) * 60}
                className={`${styles.card} ${styles.cardReal}`}
                style={{ "--tint": g.tint } as React.CSSProperties}
              >
                {book.cover_url && (
                  <img className={styles.cover} src={book.cover_url} alt="" loading="lazy" decoding="async" />
                )}
                <span className={styles.spine} aria-hidden="true" />
                <span className={styles.cardGenre}>{book.title}</span>
                {book.author && <span className={`micro ${styles.cardState}`}>{book.author}</span>}
              </Reveal>
            ));
          })}
        </div>
      )}
    </>
  );
}
