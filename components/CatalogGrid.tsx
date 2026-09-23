"use client";

import { useEffect, useState } from "react";
import type { Genre } from "@/lib/content";
import { addToCart, apiMessage, formatPrice, getBooks, type Book } from "@/lib/api";
import { useToast } from "./ToastProvider";
import Link from "next/link";
import Reveal from "./Reveal";
import Seal from "./Seal";
import styles from "./CatalogGrid.module.css";

/**
 * The catalogue as it actually is right now: real, working filters over a
 * shelf that starts empty and fills in as books get published through the
 * admin API. Genres with no book yet keep the honest "Готується"
 * placeholder; genres with one get a real card instead.
 */
export default function CatalogGrid({ genres }: { genres: Genre[] }) {
  const toast = useToast();
  const [active, setActive] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    getBooks().then(setBooks);
  }, []);

  async function buy(slug: string) {
    try {
      await addToCart(slug);
      // the cart has no nav entry of its own; without this the reader is
      // told the book landed somewhere and not where that somewhere is
      toast("додано в кошик – він у вашому кабінеті");
    } catch (err) {
      toast(apiMessage(err, "не вдалося додати в кошик"));
    }
  }

  const shown = active ? genres.filter((g) => g.slug === active) : genres;

  return (
    <>
      {/* While the shelf is empty the filters have nothing to sort: they
          printed the six directions as chips and the placeholders printed the
          same six directly underneath, so the page said every genre twice to
          filter nothing. They come back on their own with the first book. */}
      {books.length > 0 && (
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
      )}

      {books.length === 0 && (
        <div className={styles.head}>
          <span className="micro micro--bright">напрями видавництва</span>
          <span className={`micro ${styles.hint}`}>оберіть напрям, щоб дізнатися більше</span>
        </div>
      )}

      {shown.length === 0 ? (
        <p className={`body ${styles.none}`}>У цьому напрямі поки нічого не заплановано.</p>
      ) : (
        <div className={styles.grid}>
          {shown.map((g, i) => {
            const genreBooks = books.filter((b) => b.genre_slug === g.slug);
            if (genreBooks.length === 0) {
              // a clothbound volume with its title stamped on and nothing
              // inside yet: tall empty dashed slots read as a page that had
              // failed to load, and on a phone six of them ran to four screens
              return (
                <Reveal key={g.slug} delay={i * 50} className={styles.slot}>
                  <Link
                    href={`/genres#${g.slug}`}
                    prefetch={false}
                    className={styles.card}
                    style={{ "--tint": g.tint } as React.CSSProperties}
                  >
                    <span className={styles.spine} aria-hidden="true" />
                    <span className={styles.frame} aria-hidden="true" />
                    <span className={styles.emblem} aria-hidden="true">
                      <Seal ticks={0} emblem />
                    </span>
                    <span className={styles.cardTitle}>{g.title}</span>
                    <span className={styles.foot}>
                      <span className={`micro ${styles.cardState}`}>Готується</span>
                      <span className={styles.arrow} aria-hidden="true">
                        →
                      </span>
                    </span>
                  </Link>
                </Reveal>
              );
            }
            return genreBooks.map((book, bi) => (
              <Reveal key={book.slug} delay={(i + bi) * 50} className={styles.slot}>
                <article
                  className={`${styles.card} ${styles.cardReal}`}
                  style={{ "--tint": g.tint } as React.CSSProperties}
                >
                  {book.cover_url && (
                    <img className={styles.cover} src={book.cover_url} alt="" loading="lazy" decoding="async" />
                  )}
                  <span className={styles.spine} aria-hidden="true" />
                  <span className={styles.cardTitle}>{book.title}</span>
                  {book.author && <span className={`micro ${styles.cardState}`}>{book.author}</span>}
                  {book.price_cents != null && (
                    <span className={styles.buy}>
                      <span className="micro micro--bright">{formatPrice(book.price_cents, book.currency)}</span>
                      <button type="button" className="pill" onClick={() => buy(book.slug)}>
                        У кошик
                      </button>
                    </span>
                  )}
                </article>
              </Reveal>
            ));
          })}
        </div>
      )}
    </>
  );
}
