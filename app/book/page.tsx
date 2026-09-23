"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BookCover from "@/components/BookCover";
import { useToast } from "@/components/ToastProvider";
import {
  FORMAT_LABEL,
  discountPct,
  formatPrice,
  formatSku,
  getBook,
  getBooks,
  getPayMethods,
  oldPrice,
  type Book,
  type Format,
} from "@/lib/api";
import { addLine, useCart } from "@/lib/cart";
import { genres } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";
import styles from "./book.module.css";

/** schema.org Book with one Offer per format, so a search result can show
 * the price and whether the book is in stock */
function jsonLd(b: Book) {
  const offers = (["print", "ebook"] as Format[])
    .map((f) => {
      const p = f === "print" ? b.print_price_cents : b.ebook_price_cents;
      if (p == null) return null;
      return {
        "@type": "Offer",
        sku: formatSku(b.sku, f),
        price: (p / 100).toFixed(2),
        priceCurrency: b.currency || "UAH",
        availability:
          f === "ebook" || b.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        url: `${SITE_URL}/book?s=${b.slug}`,
      };
    })
    .filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": ["Book", "Product"],
    name: b.title,
    sku: b.sku,
    ...(b.isbn ? { isbn: b.isbn, gtin13: b.isbn.replace(/\D/g, "") } : {}),
    ...(b.author ? { author: { "@type": "Person", name: b.author } } : {}),
    ...(b.description ? { description: b.description } : {}),
    ...(b.cover_url ? { image: new URL(b.cover_url, SITE_URL).href } : {}),
    ...(b.pages ? { numberOfPages: b.pages } : {}),
    inLanguage: "uk",
    publisher: { "@type": "Organization", name: "ВІДЬМАР" },
    brand: { "@type": "Brand", name: "ВІДЬМАР" },
    offers,
  };
}

function BookView() {
  const slug = useSearchParams().get("s") || "";
  const toast = useToast();
  const cart = useCart();
  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [related, setRelated] = useState<Book[]>([]);
  const [format, setFormat] = useState<Format>("print");
  const [qty, setQty] = useState(1);
  const [barOn, setBarOn] = useState(false);
  const [payNote, setPayNote] = useState("");
  const buyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBook(undefined);
    setQty(1);
    getBook(slug).then((b) => {
      setBook(b);
      if (!b) return;
      document.title = `${b.title} – ВІДЬМАР`;
      // start on the format that can actually be bought
      if (b.print_price_cents == null || !b.in_stock) setFormat(b.ebook_price_cents != null ? "ebook" : "print");
      else setFormat("print");
      getBooks().then((all) => {
        const same = all.filter((x) => x.slug !== b.slug && x.genre_slug === b.genre_slug);
        const rest = all.filter((x) => x.slug !== b.slug && x.genre_slug !== b.genre_slug);
        setRelated([...same, ...rest].slice(0, 4));
      });
    });
  }, [slug]);

  // named from what the shop really takes today, not from what it will
  useEffect(() => {
    getPayMethods().then((ms) => {
      const on = new Set(ms.filter((m) => m.enabled).map((m) => m.id));
      const parts = [
        on.has("mono") && "карткою, Apple Pay чи Google Pay",
        on.has("liqpay") && "у Приват24",
        on.has("iban") && "переказом на рахунок",
        on.has("cod") && "при отриманні (для паперових)",
      ].filter(Boolean) as string[];
      const text = parts.join(", ");
      setPayNote(text.charAt(0).toUpperCase() + text.slice(1));
    });
  }, []);

  // the phone bar shows once the buy buttons have scrolled away
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBarOn(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [book]);

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
  const was = oldPrice(book, format);
  const buyable = price != null && (format === "ebook" || !!book.in_stock);
  const sku = formatSku(book.sku, format);
  const inCart = cart.find((l) => l.slug === book.slug && l.format === format);
  const maxQty = Math.min(20, book.stock_left ?? 20);

  const add = () => {
    if (!buyable || price == null) return;
    addLine(
      {
        slug: book.slug,
        format,
        title: book.title,
        author: book.author,
        price_cents: price,
        cover_url: book.cover_url,
        cover_pos: book.cover_pos ?? null,
        sku: book.sku ?? null,
        old_price_cents: was,
      },
      format === "print" ? qty : 1,
    );
    toast(`«${book.title}» у кошику`);
  };

  const stock =
    format === "ebook"
      ? { cls: styles.stockOk, text: "Доступна одразу після оплати" }
      : !book.in_stock
        ? { cls: styles.stockOut, text: "Немає в наявності" }
        : book.stock_left != null
          ? { cls: styles.stockLow, text: `Залишилось ${book.stock_left} шт.` }
          : { cls: styles.stockOk, text: "В наявності" };

  const specs = [
    ["Артикул", sku],
    ["Автор", book.author],
    ["Серія", book.series],
    ["Перекладач", book.translator],
    ["Ілюстрації", book.illustrator],
    ["Мова", book.language],
    ["Палітурка", format === "print" ? book.binding : "PDF та EPUB"],
    ["Сторінок", book.pages],
    ["Формат", format === "print" ? book.dimensions : null],
    ["Вага", format === "print" && book.weight_g ? `${book.weight_g} г` : null],
    ["Рік видання", book.year],
    ["ISBN", book.isbn],
    ["Вік", book.age_rating],
    ["Напрям", genre?.title],
  ].filter(([, v]) => v) as [string, string | number][];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(book)).replace(/</g, "\\u003c") }} />

      <nav className={styles.crumbs} aria-label="Шлях">
        <Link href="/catalog">Каталог</Link>
        {genre && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/catalog?g=${genre.slug}`}>{genre.title}</Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className={styles.crumbHere}>{book.title}</span>
      </nav>

      <div className={styles.layout}>
        <div className={styles.coverCol}>
          <div className={styles.coverWrap}>
            <BookCover title={book.title} author={book.author} src={book.cover_url} pos={book.cover_pos} size="big" />
            {was != null && price != null && <span className={styles.badge}>−{discountPct(price, was)}%</span>}
          </div>
        </div>

        <div className={styles.info}>
          {book.is_demo && <span className={styles.demoTag}>демонстраційне видання</span>}
          {book.series && <span className={styles.series}>Серія «{book.series}»</span>}
          <h1 className={styles.title}>{book.title}</h1>
          {book.author && <p className={styles.author}>{book.author}</p>}
          <p className={styles.skuLine}>
            {sku && <span>Артикул {sku}</span>}
            {book.isbn && <span>ISBN {book.isbn}</span>}
          </p>

          <div className={styles.formats} role="radiogroup" aria-label="Формат">
            {(["print", "ebook"] as Format[]).map((f) => {
              const p = f === "print" ? book.print_price_cents : book.ebook_price_cents;
              if (p == null) return null;
              const o = oldPrice(book, f);
              const out = f === "print" && !book.in_stock;
              return (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={format === f}
                  className={`${styles.format} ${format === f ? styles.formatOn : ""} ${out ? styles.formatOut : ""}`}
                  onClick={() => {
                    setFormat(f);
                    setQty(1);
                  }}
                >
                  <span className={styles.formatName}>
                    {FORMAT_LABEL[f]}
                    {o != null && <span className={styles.formatSale}>−{discountPct(p, o)}%</span>}
                  </span>
                  <span className={styles.formatPrice}>
                    {formatPrice(p, book.currency)}
                    {o != null && <s>{formatPrice(o, book.currency)}</s>}
                  </span>
                  <span className={styles.formatNote}>
                    {f === "ebook" ? "PDF + EPUB" : out ? "Немає в наявності" : book.binding || "Нова пошта"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.priceRow}>
            {price != null && (
              <span className={styles.bigPrice}>
                {formatPrice(price * (format === "print" ? qty : 1), book.currency)}
                {was != null && <s>{formatPrice(was * (format === "print" ? qty : 1), book.currency)}</s>}
              </span>
            )}
            <span className={`${styles.stock} ${stock.cls}`}>{stock.text}</span>
          </div>

          <div className={styles.buy} ref={buyRef}>
            {format === "print" && buyable && (
              <span className={styles.qty} role="group" aria-label="Кількість">
                <button type="button" aria-label="Менше" disabled={qty <= 1} onClick={() => setQty(qty - 1)}>
                  −
                </button>
                <output aria-live="polite">{qty}</output>
                <button type="button" aria-label="Більше" disabled={qty >= maxQty} onClick={() => setQty(qty + 1)}>
                  +
                </button>
              </span>
            )}
            <button
              type="button"
              className={`pill pill--solid ${styles.addBtn}`}
              disabled={!buyable || (format === "ebook" && !!inCart)}
              onClick={add}
            >
              {!buyable ? "Немає в наявності" : format === "ebook" && inCart ? "Уже в кошику" : "Додати в кошик"}
            </button>
            {inCart && (
              <Link className="pill pill--bare" href="/cart" prefetch={false}>
                У кошику{format === "print" ? `: ${inCart.quantity}` : ""} · оформити
              </Link>
            )}
          </div>

          <ul className={styles.perks}>
            <li>
              <b>Доставка</b>
              <span>Новою поштою у відділення чи поштомат, 1–3 дні</span>
            </li>
            <li>
              <b>Оплата</b>
              <span>{payNote || "…"}</span>
            </li>
            <li>
              <b>Електронна версія</b>
              <span>PDF та EPUB, завантаження одразу після оплати</span>
            </li>
          </ul>

          {book.description && (
            <div className={styles.section}>
              <h2 className={styles.h2}>Про книгу</h2>
              <p className={styles.desc}>{book.description}</p>
            </div>
          )}
          {book.excerpt && (
            <figure className={styles.excerpt}>
              <blockquote>
                <p>{book.excerpt}</p>
              </blockquote>
              <figcaption className="micro">з книги</figcaption>
            </figure>
          )}

          <div className={styles.section}>
            <h2 className={styles.h2}>Характеристики</h2>
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
      </div>

      {related.length > 0 && (
        <section className={styles.related}>
          <h2 className={styles.relatedTitle}>{genre ? "Схожі книги" : "Також у каталозі"}</h2>
          <div className={styles.relatedGrid}>
            {related.map((b) => {
              const p = b.print_price_cents ?? b.ebook_price_cents;
              return (
                <Link key={b.slug} href={`/book?s=${b.slug}`} prefetch={false} className={styles.relatedBook}>
                  <BookCover title={b.title} author={b.author} src={b.cover_url} pos={b.cover_pos} />
                  <span>{b.title}</span>
                  {p != null && <span className={styles.relatedPrice}>{formatPrice(p, b.currency)}</span>}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className={`${styles.bar} ${barOn ? styles.barOn : ""}`} aria-hidden={!barOn}>
        <span className={styles.barInfo}>
          <b>{book.title}</b>
          {price != null && (
            <span>
              {FORMAT_LABEL[format]} · {formatPrice(price, book.currency)}
            </span>
          )}
        </span>
        <button
          type="button"
          className="pill pill--solid pill--bare"
          tabIndex={barOn ? 0 : -1}
          disabled={!buyable || (format === "ebook" && !!inCart)}
          onClick={add}
        >
          {format === "ebook" && inCart ? "У кошику" : "У кошик"}
        </button>
      </div>
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
