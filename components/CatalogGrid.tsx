"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Genre } from "@/lib/content";
import { discountPct, formatPrice, getBooks, oldPrice, type Book, type Format } from "@/lib/api";
import { addLine, useCart } from "@/lib/cart";
import { useToast } from "./ToastProvider";
import BookCover from "./BookCover";
import Reveal from "./Reveal";
import Seal from "./Seal";
import styles from "./CatalogGrid.module.css";

type FormatFilter = "all" | "print" | "ebook";
type Sort = "order" | "cheap" | "dear" | "sale";

/** lowest price across the formats a book is actually sold in */
function fromPrice(b: Book) {
  const p = [b.print_price_cents, b.ebook_price_cents].filter((v): v is number => v != null);
  return p.length ? Math.min(...p) : null;
}

/** the format a one-tap add should take: paper while there is paper */
function quickFormat(b: Book): Format | null {
  if (b.print_price_cents != null && b.in_stock) return "print";
  if (b.ebook_price_cents != null) return "ebook";
  return null;
}

function BookCard({ b }: { b: Book }) {
  const toast = useToast();
  const cart = useCart();
  const from = fromPrice(b);
  const f = quickFormat(b);
  const price = f && (f === "print" ? b.print_price_cents : b.ebook_price_cents);
  const was = f ? oldPrice(b, f) : null;
  const inCart = cart.some((l) => l.slug === b.slug);
  const href = `/book?s=${b.slug}`;
  const soldOut = b.print_price_cents != null && !b.in_stock && b.ebook_price_cents == null;

  return (
    <div className={styles.book}>
      <Link href={href} prefetch={false} className={styles.bookLink}>
        <span className={styles.coverBox}>
          <BookCover title={b.title} author={b.author} src={b.cover_url} pos={b.cover_pos} />
          <span className={styles.badges}>
            {was != null && price != null && <span className={styles.badgeSale}>−{discountPct(price, was)}%</span>}
            {b.stock_left != null && b.stock_left > 0 && <span className={styles.badgeLow}>Останні {b.stock_left}</span>}
            {soldOut && <span className={styles.badgeOut}>Немає</span>}
          </span>
        </span>
        <span className={styles.bookTitle}>{b.title}</span>
        {b.author && <span className={styles.bookAuthor}>{b.author}</span>}
      </Link>
      <span className={styles.bookFoot}>
        <span className={styles.priceBox}>
          <span className={styles.priceRow}>
            {price != null ? (
              <>
                <span className={styles.price}>{formatPrice(price, b.currency)}</span>
                {was != null && <s className={styles.was}>{formatPrice(was, b.currency)}</s>}
              </>
            ) : (
              from != null && <span className={styles.price}>від {formatPrice(from, b.currency)}</span>
            )}
          </span>
          <span className={styles.formats}>
            {[
              b.print_price_cents != null && (b.in_stock ? "папір" : "папір закінчився"),
              b.ebook_price_cents != null && "e-book",
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        {f && price != null && (
          <button
            type="button"
            className={`${styles.add} ${inCart ? styles.addOn : ""}`}
            aria-label={inCart ? `«${b.title}» у кошику` : `Додати «${b.title}» у кошик`}
            title={inCart ? "У кошику" : f === "print" ? "У кошик (паперова)" : "У кошик (електронна)"}
            onClick={() => {
              if (f === "ebook" && inCart) return;
              addLine({
                slug: b.slug,
                format: f,
                title: b.title,
                author: b.author,
                price_cents: price,
                cover_url: b.cover_url,
                cover_pos: b.cover_pos ?? null,
                sku: b.sku ?? null,
                old_price_cents: was,
              });
              toast(`«${b.title}» у кошику`);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {inCart ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M6 8h12l-1.2 11H7.2zM9 8V6.5a3 3 0 0 1 6 0V8M12 11.5v5M9.5 14h5" />}
            </svg>
          </button>
        )}
      </span>
    </div>
  );
}

export default function CatalogGrid({ genres, initial = null }: { genres: Genre[]; initial?: Book[] | null }) {
  // the shelf as it stood at build time paints at once; the API then brings
  // prices and stock up to date instead of the reader waiting on it
  const [books, setBooks] = useState<Book[] | null>(initial);
  const [genre, setGenre] = useState<string | null>(null);
  const [format, setFormat] = useState<FormatFilter>("all");
  const [sort, setSort] = useState<Sort>("order");
  const [q, setQ] = useState("");

  useEffect(() => {
    getBooks().then((b) => setBooks((prev) => (b.length || !prev ? b : prev)));
  }, []);

  // /genres links in as ?g=<slug>. Read here rather than with
  // useSearchParams: under `output: export` that would push the whole grid
  // behind a Suspense boundary for one value read once.
  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("g");
    if (g && genres.some((x) => x.slug === g)) setGenre(g);
  }, [genres]);

  // keep the address in step with the chips, so a filtered shelf can be
  // shared or come back to
  useEffect(() => {
    const url = new URL(window.location.href);
    if (genre) url.searchParams.set("g", genre);
    else url.searchParams.delete("g");
    if (url.href !== window.location.href) window.history.replaceState(null, "", url);
  }, [genre]);

  const shown = useMemo(() => {
    if (!books) return [];
    const needle = q.trim().toLowerCase();
    const list = books.filter(
      (b) =>
        (!genre || b.genre_slug === genre) &&
        (format === "all" || (format === "print" ? b.print_price_cents != null : b.ebook_price_cents != null)) &&
        (!needle || `${b.title} ${b.author ?? ""} ${b.sku ?? ""} ${b.isbn ?? ""}`.toLowerCase().includes(needle)),
    );
    if (sort === "order") return list;
    if (sort === "sale") {
      const off = (b: Book) => {
        const f = quickFormat(b);
        const now = f && (f === "print" ? b.print_price_cents : b.ebook_price_cents);
        const was = f ? oldPrice(b, f) : null;
        return now != null && was != null ? discountPct(now, was) : 0;
      };
      return [...list].sort((a, b) => off(b) - off(a));
    }
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
          <b>Демо-каталог.</b> Книги й автори вигадані, платити за замовлення не потрібно.
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
            placeholder="Назва, автор, артикул чи ISBN"
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
            <option value="sale">Спершу зі знижкою</option>
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className={`body ${styles.none}`}>Нічого не знайшлось. Спробуйте інший напрям чи формат.</p>
      ) : (
        <div className={styles.books}>
          {shown.map((b, i) => (
            <Reveal key={b.slug} delay={Math.min(i, 6) * 40} className={styles.slot}>
              <BookCard b={b} />
            </Reveal>
          ))}
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
