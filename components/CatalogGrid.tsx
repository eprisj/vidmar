"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Genre } from "@/lib/content";
import { formatPrice, getBooks, type Book } from "@/lib/api";
import BookCover from "./BookCover";
import Reveal from "./Reveal";
import Seal from "./Seal";
import styles from "./CatalogGrid.module.css";

type FormatFilter = "all" | "print" | "ebook";
type Sort = "order" | "cheap" | "dear";

/** lowest price across the formats a book is actually sold in */
function fromPrice(b: Book) {
  const p = [b.print_price_cents, b.ebook_price_cents].filter((v): v is number => v != null);
  return p.length ? Math.min(...p) : null;
}

export default function CatalogGrid({ genres }: { genres: Genre[] }) {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [format, setFormat] = useState<FormatFilter>("all");
  const [sort, setSort] = useState<Sort>("order");
  const [q, setQ] = useState("");

  useEffect(() => {
    getBooks().then(setBooks);
  }, []);

  const shown = useMemo(() => {
    if (!books) return [];
    const needle = q.trim().toLowerCase();
    const list = books.filter(
      (b) =>
        (!genre || b.genre_slug === genre) &&
        (format === "all" || (format === "print" ? b.print_price_cents != null : b.ebook_price_cents != null)) &&
        (!needle || `${b.title} ${b.author ?? ""}`.toLowerCase().includes(needle)),
    );
    if (sort === "order") return list;
    return [...list].sort((a, b) => {
      const d = (fromPrice(a) ?? 1e9) - (fromPrice(b) ?? 1e9);
      return sort === "cheap" ? d : -d;
    });
  }, [books, genre, format, sort, q]);

  if (books === null) return <div className={styles.loading} aria-busy="true" />;

  // no books at all yet: the six directions as closed volumes, as before
  if (books.length === 0) return <GenreShelf genres={genres} />;

  const demo = books.some((b) => b.is_demo);

  return (
    <>
      {demo && (
        <p className={styles.demo}>
          <b>Демонстраційний каталог.</b> Книги й автори вигадані, щоб показати, як працюватиме
          магазин. Оформити замовлення можна, але надсилати гроші не потрібно.
        </p>
      )}

      <div className={styles.tools}>
        <div className={styles.filters} role="group" aria-label="Напрям">
          <button
            type="button"
            className={`${styles.chip} ${genre === null ? styles.chipOn : ""}`}
            aria-pressed={genre === null}
            onClick={() => setGenre(null)}
          >
            Усі напрями
          </button>
          {genres
            .filter((g) => books.some((b) => b.genre_slug === g.slug))
            .map((g) => (
              <button
                key={g.slug}
                type="button"
                className={`${styles.chip} ${genre === g.slug ? styles.chipOn : ""}`}
                aria-pressed={genre === g.slug}
                onClick={() => setGenre(genre === g.slug ? null : g.slug)}
              >
                {g.title}
              </button>
            ))}
        </div>

        <div className={styles.row2}>
          <div className={styles.seg} role="group" aria-label="Формат">
            {(
              [
                ["all", "Усі формати"],
                ["print", "Паперові"],
                ["ebook", "Електронні"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={format === v ? styles.segOn : ""}
                aria-pressed={format === v}
                onClick={() => setFormat(v)}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            className={styles.search}
            type="search"
            placeholder="Пошук за назвою чи автором"
            aria-label="Пошук"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className={styles.sort}
            aria-label="Сортування"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            <option value="order">Спершу нові</option>
            <option value="cheap">Спершу дешевші</option>
            <option value="dear">Спершу дорожчі</option>
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className={`body ${styles.none}`}>Нічого не знайшлось. Спробуйте інший напрям чи формат.</p>
      ) : (
        <div className={styles.books}>
          {shown.map((b, i) => {
            const from = fromPrice(b);
            return (
              <Reveal key={b.slug} delay={Math.min(i, 6) * 40} className={styles.slot}>
                <Link href={`/book?s=${b.slug}`} prefetch={false} className={styles.book}>
                  <BookCover title={b.title} author={b.author} src={b.cover_url} pos={b.cover_pos} />
                  <span className={styles.bookTitle}>{b.title}</span>
                  {b.author && <span className={styles.bookAuthor}>{b.author}</span>}
                  <span className={styles.bookFoot}>
                    {from != null && (
                      <span className={styles.price}>від {formatPrice(from, b.currency)}</span>
                    )}
                    <span className={styles.formats}>
                      {b.print_price_cents != null && (
                        <span className={b.in_stock ? "" : styles.out} title={b.in_stock ? "" : "Немає в наявності"}>
                          папір
                        </span>
                      )}
                      {b.ebook_price_cents != null && <span>e-book</span>}
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </>
  );
}

function GenreShelf({ genres }: { genres: Genre[] }) {
  return (
    <>
      <div className={styles.head}>
        <span className="micro micro--bright">напрями видавництва</span>
        <span className={`micro ${styles.hint}`}>оберіть напрям, щоб дізнатися більше</span>
      </div>
      <div className={styles.grid}>
        {genres.map((g, i) => (
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
        ))}
      </div>
    </>
  );
}
