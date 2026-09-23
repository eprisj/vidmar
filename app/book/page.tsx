"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BookCover from "@/components/BookCover";
import { useToast } from "@/components/ToastProvider";
import { FORMAT_LABEL, formatPrice, getBook, getBooks, type Book, type Format } from "@/lib/api";
import { addLine } from "@/lib/cart";
import { genres } from "@/lib/content";
import styles from "./book.module.css";

/* One client page read by ?s=: the site is a static export, and a book added
   in the admin has to have a page the moment it is published, not after the
   next rebuild. */
function BookView() {
  const slug = useSearchParams().get("s") || "";
  const toast = useToast();
  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [related, setRelated] = useState<Book[]>([]);
  const [format, setFormat] = useState<Format>("print");

  useEffect(() => {
    setBook(undefined);
    getBook(slug).then((b) => {
      setBook(b);
      if (!b) return;
      document.title = `${b.title} – ВІДЬМАР`;
      // start on the format that can actually be bought
      if (b.print_price_cents == null || !b.in_stock) setFormat(b.ebook_price_cents != null ? "ebook" : "print");
      else setFormat("print");
      getBooks().then((all) =>
        setRelated(all.filter((x) => x.slug !== b.slug && x.genre_slug === b.genre_slug).slice(0, 4)),
      );
    });
  }, [slug]);

  if (book === undefined) return <div className={styles.loading} aria-busy="true" />;
  if (book === null)
    return (
      <div className={styles.missing}>
        <p className="body">Такої книги немає в каталозі.</p>
        <Link className="pill" href="/catalog">
          До каталогу
        </Link>
      </div>
    );

  const genre = genres.find((g) => g.slug === book.genre_slug);
  const price = format === "print" ? book.print_price_cents : book.ebook_price_cents;
  const buyable = price != null && (format === "ebook" || book.in_stock);

  const specs = [
    ["Формат", format === "print" ? book.binding || "Паперова" : "PDF та EPUB"],
    ["Сторінок", book.pages],
    ["Рік", book.year],
    ["ISBN", book.isbn],
    ["Напрям", genre?.title],
  ].filter(([, v]) => v) as [string, string | number][];

  return (
    <>
      <nav className={styles.crumbs} aria-label="Шлях">
        <Link href="/catalog">Каталог</Link>
        {genre && (
          <>
            <span aria-hidden="true">/</span>
            <span>{genre.title}</span>
          </>
        )}
      </nav>

      <div className={styles.layout}>
        <div className={styles.coverCol}>
          <BookCover title={book.title} author={book.author} src={book.cover_url} pos={book.cover_pos} size="big" />
        </div>

        <div className={styles.info}>
          {book.is_demo && <span className={styles.demoTag}>демонстраційне видання</span>}
          <h1 className={styles.title}>{book.title}</h1>
          {book.author && <p className={styles.author}>{book.author}</p>}

          <div className={styles.formats} role="radiogroup" aria-label="Формат">
            {(["print", "ebook"] as Format[]).map((f) => {
              const p = f === "print" ? book.print_price_cents : book.ebook_price_cents;
              if (p == null) return null;
              const out = f === "print" && !book.in_stock;
              return (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={format === f}
                  className={`${styles.format} ${format === f ? styles.formatOn : ""}`}
                  onClick={() => setFormat(f)}
                >
                  <span className={styles.formatName}>{FORMAT_LABEL[f]}</span>
                  <span className={styles.formatPrice}>{formatPrice(p, book.currency)}</span>
                  <span className={styles.formatNote}>
                    {f === "ebook" ? "PDF + EPUB, одразу після оплати" : out ? "Немає в наявності" : "Нова пошта, 1–3 дні"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.buy}>
            <button
              type="button"
              className="pill pill--solid"
              disabled={!buyable}
              onClick={() => {
                addLine({
                  slug: book.slug,
                  format,
                  title: book.title,
                  author: book.author,
                  price_cents: price!,
                  cover_url: book.cover_url,
                  cover_pos: book.cover_pos ?? null,
                });
                toast(`«${book.title}» у кошику`);
              }}
            >
              {buyable ? "Додати в кошик" : "Немає в наявності"}
            </button>
            <Link className="pill pill--bare" href="/cart" prefetch={false}>
              Перейти до кошика
            </Link>
          </div>

          {book.description && <p className={styles.desc}>{book.description}</p>}
          {book.excerpt && (
            <blockquote className={styles.excerpt}>
              <span className="micro">уривок</span>
              <p>{book.excerpt}</p>
            </blockquote>
          )}

          <dl className={styles.specs}>
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className={styles.related}>
          <h2 className={styles.relatedTitle}>Із цього ж напряму</h2>
          <div className={styles.relatedGrid}>
            {related.map((b) => (
              <Link key={b.slug} href={`/book?s=${b.slug}`} prefetch={false} className={styles.relatedBook}>
                <BookCover title={b.title} author={b.author} src={b.cover_url} pos={b.cover_pos} />
                <span>{b.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function BookPage() {
  return (
    <section className={`deep ${styles.root}`} data-field="dark">
      <div className="wrapMax">
        <Suspense fallback={<div className={styles.loading} />}>
          <BookView />
        </Suspense>
      </div>
    </section>
  );
}
