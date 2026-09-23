"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BookCover from "@/components/BookCover";
import {
  FORMAT_LABEL,
  apiMessage,
  formatPrice,
  getBooks,
  getMe,
  getPayMethods,
  placeOrder,
  type Book,
  type NpCity,
  type NpWarehouse,
  type PayMethod,
  type PlacedOrder,
} from "@/lib/api";
import { cartCount, clearCart, patchLine, readCart, removeLine, setQuantity, useCart, type CartLine } from "@/lib/cart";
import { ONLINE, PAY_INFO } from "@/lib/payments";
import NovaPoshta, { formatPhone } from "@/components/NovaPoshta";
import styles from "./cart.module.css";

const books = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} книга`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} книги`;
  return `${n} книг`;
};

function Line({ l }: { l: CartLine }) {
  const href = `/book?s=${l.slug}`;
  const sku = l.sku ? `${l.sku}-${l.format === "ebook" ? "E" : "P"}` : null;
  return (
    <li className={styles.line}>
      <Link href={href} prefetch={false} className={styles.thumb} tabIndex={-1} aria-hidden="true">
        <BookCover title={l.title} src={l.cover_url} pos={l.cover_pos} size="small" />
      </Link>
      <div className={styles.lineInfo}>
        <Link href={href} prefetch={false} className={styles.lineTitle}>
          {l.title}
        </Link>
        {l.author && <span className={styles.lineAuthor}>{l.author}</span>}
        <span className={styles.tags}>
          <span className={styles.tag}>{FORMAT_LABEL[l.format]}</span>
          {l.format === "ebook" && <span className={styles.tagQuiet}>PDF + EPUB</span>}
          {sku && (
            <span className="skuTag">
              <i>Арт.</i>
              {sku}
            </span>
          )}
        </span>
      </div>
      <div className={styles.lineCtl}>
        {l.format === "print" ? (
          <span className={styles.qty} role="group" aria-label={`Кількість: ${l.title}`}>
            <button
              type="button"
              aria-label="Менше"
              onClick={() => setQuantity(l.slug, l.format, l.quantity - 1)}
            >
              −
            </button>
            <output aria-live="polite">{l.quantity}</output>
            <button
              type="button"
              aria-label="Більше"
              disabled={l.quantity >= 20}
              onClick={() => setQuantity(l.slug, l.format, l.quantity + 1)}
            >
              +
            </button>
          </span>
        ) : (
          <span className={styles.qtyFixed}>1 файл</span>
        )}
      </div>
      <div className={styles.linePrice}>
        <strong>{formatPrice(l.price_cents * l.quantity, "UAH")}</strong>
        {l.old_price_cents != null && l.old_price_cents > l.price_cents && (
          <s>{formatPrice(l.old_price_cents * l.quantity, "UAH")}</s>
        )}
        {l.quantity > 1 && <small>{formatPrice(l.price_cents, "UAH")} / шт.</small>}
      </div>
      <button
        type="button"
        className={styles.remove}
        aria-label={`Прибрати «${l.title}»`}
        title="Прибрати"
        onClick={() => removeLine(l.slug, l.format)}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
        </svg>
      </button>
    </li>
  );
}

function EmptyCart() {
  const [picks, setPicks] = useState<Book[]>([]);
  useEffect(() => {
    getBooks().then((all) => setPicks(all.filter((b) => b.print_price_cents != null || b.ebook_price_cents != null).slice(0, 4)));
  }, []);
  return (
    <div className={styles.emptyWrap}>
      <div className={styles.emptyCart}>
        <svg className={styles.emptyMark} viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="30" />
          <circle cx="32" cy="32" r="24" />
          <path d="M22 24h20l-2.5 18h-15z M27 24v-3a5 5 0 0 1 10 0v3" />
        </svg>
        <h2 className={styles.h2}>Кошик поки порожній</h2>
        <p className="body">Оберіть книгу в каталозі: паперову з доставкою Новою поштою або електронну, що відкриється одразу після оплати.</p>
        <Link className="pill pill--solid" href="/catalog">
          До каталогу
        </Link>
      </div>
      {picks.length > 0 && (
        <div className={styles.picks}>
          <span className="micro">можливо, вас зацікавить</span>
          <div className={styles.picksGrid}>
            {picks.map((b) => {
              const price = b.print_price_cents ?? b.ebook_price_cents;
              return (
                <Link key={b.slug} href={`/book?s=${b.slug}`} prefetch={false} className={styles.pick}>
                  <BookCover title={b.title} author={b.author} src={b.cover_url} pos={b.cover_pos} />
                  <span className={styles.pickTitle}>{b.title}</span>
                  {price != null && <span className={styles.pickPrice}>{formatPrice(price, b.currency)}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Placed({ order }: { order: PlacedOrder }) {
  const link = `/order?id=${order.id}&t=${order.access_token}`;
  const cod = order.payment_method === "cod";
  return (
    <div className={styles.done}>
      <svg className={styles.doneMark} viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="30" />
        <path d="M20 33l8 8 16-18" />
      </svg>
      <span className="micro micro--bright">замовлення №{order.id}</span>
      <h1 className={styles.h1}>Дякуємо, замовлення прийнято</h1>
      <p className="body">
        {cod
          ? "Ми звʼяжемося з вами, щоб підтвердити замовлення, і надішлемо посилку. Оплата при отриманні у відділенні."
          : ONLINE.includes(order.payment_method)
            ? "Платіжна сторінка не відкрилась. Оплатити можна зі сторінки замовлення, спроба займе хвилину."
            : "Реквізити для переказу чекають на сторінці замовлення. Щойно гроші надійдуть, ми відправимо книги."}
      </p>
      <Link className="pill pill--solid" href={link} prefetch={false}>
        {cod ? "Сторінка замовлення" : "Перейти до оплати"}
      </Link>
    </div>
  );
}

export default function CartPage() {
  const lines = useCart();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [city, setCity] = useState<NpCity | null>(null);
  const [warehouse, setWarehouse] = useState<NpWarehouse | null>(null);
  const [methods, setMethods] = useState<{ id: PayMethod; enabled: boolean }[]>([]);
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [summaryOn, setSummaryOn] = useState(false);
  const summaryRef = useRef<HTMLElement>(null);

  // the phone bar steps aside once the real summary is on screen: two
  // "До сплати" and two buttons at once read as a glitch
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const r = summaryRef.current?.getBoundingClientRect();
      setSummaryOn(!!r && r.top < window.innerHeight - 80 && r.bottom > 0);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [mounted, lines.length]);

  useEffect(() => {
    setMounted(true);
    getMe()
      .then((u) => {
        setEmail((e) => e || u.email);
        setName((n) => n || u.name || "");
        setPhone((p) => p || u.phone || "");
        // the account's saved branch, unless one was already picked here
        const d = u.delivery;
        if (d) {
          setCity((c) => c ?? { ref: d.cityRef, name: d.cityName, area: d.area || "" });
          setWarehouse((w) => w ?? { ref: d.warehouseRef, name: d.warehouseName, number: "" });
        }
      })
      .catch(() => {});
    getPayMethods().then(setMethods);
    // the cart remembers what the book cost when it was added; the catalogue
    // says what it costs now (the server re-prices at checkout either way,
    // this only keeps the sum on screen honest)
    getBooks().then((all) => {
      for (const l of readCart()) {
        const b = all.find((x) => x.slug === l.slug);
        if (!b) continue;
        const now = l.format === "print" ? b.print_price_cents : b.ebook_price_cents;
        const was = (l.format === "print" ? b.print_old_price_cents : b.ebook_old_price_cents) ?? null;
        if (now == null) continue;
        if (now !== l.price_cents || was !== (l.old_price_cents ?? null) || (b.sku ?? null) !== (l.sku ?? null)) {
          patchLine(l.slug, l.format, { price_cents: now, old_price_cents: was, sku: b.sku ?? null });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needsDelivery = lines.some((l) => l.format === "print");
  const onlyPrint = lines.length > 0 && lines.every((l) => l.format === "print");
  const total = lines.reduce((s, l) => s + l.price_cents * l.quantity, 0);
  const full = lines.reduce((s, l) => s + Math.max(l.old_price_cents ?? 0, l.price_cents) * l.quantity, 0);
  const saved = full - total;
  const count = cartCount(lines);

  const available = useMemo(
    // what works today first; the providers still being connected go last
    () => methods.filter((m) => m.id !== "cod" || onlyPrint).sort((a, b) => Number(b.enabled) - Number(a.enabled)),
    [methods, onlyPrint],
  );
  // the first working method is picked for the buyer, and a pick that stops
  // applying (cod once an e-book lands in the cart) falls back to it
  const chosen = available.find((m) => m.id === method && m.enabled)?.id ?? available.find((m) => m.enabled)?.id ?? null;

  if (!mounted) return <section className={styles.root} />;

  if (placed) {
    return (
      <section className={styles.root} data-field="dark">
        <div className="wrapMax">
          <Placed order={placed} />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.root} data-field="dark">
      <div className="wrapMax">
        <header className={styles.head}>
          <h1 className={styles.h1}>Кошик</h1>
          {count > 0 && <span className={styles.count}>{books(count)}</span>}
        </header>

        {lines.length === 0 ? (
          <EmptyCart />
        ) : (
          <form
            className={styles.layout}
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (needsDelivery && (!city || !warehouse)) {
                setError("Оберіть місто й відділення Нової пошти");
                document.getElementById("delivery")?.scrollIntoView({ block: "center" });
                return;
              }
              if (!chosen) {
                setError("Оберіть спосіб оплати");
                return;
              }
              setBusy(true);
              try {
                const order = await placeOrder({
                  items: lines.map((l) => ({ slug: l.slug, format: l.format, quantity: l.quantity })),
                  customer: { name, phone, email },
                  delivery:
                    needsDelivery && city && warehouse
                      ? {
                          cityRef: city.ref,
                          cityName: city.name,
                          warehouseRef: warehouse.ref,
                          warehouseName: warehouse.name,
                        }
                      : undefined,
                  comment,
                  payment_method: chosen,
                });
                clearCart();
                if (order.payment_url) {
                  window.location.assign(order.payment_url);
                  return;
                }
                setPlaced(order);
                window.scrollTo({ top: 0 });
              } catch (err) {
                setError(err instanceof Error && err.message ? err.message : apiMessage(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className={styles.main}>
              <section className={styles.card} aria-labelledby="c-lines">
                <h2 id="c-lines" className={styles.h2}>
                  Ваше замовлення
                </h2>
                <ul className={styles.lines}>
                  {lines.map((l) => (
                    <Line key={`${l.slug}-${l.format}`} l={l} />
                  ))}
                </ul>
                <Link href="/catalog" className={styles.more}>
                  ← Продовжити покупки
                </Link>
              </section>

              <section className={styles.card} aria-labelledby="c-contacts">
                <h2 id="c-contacts" className={styles.h2}>
                  Контакти
                </h2>
                <div className={styles.grid2}>
                  <label className={`${styles.field} ${styles.span2}`}>
                    <span className={styles.label}>Імʼя та прізвище</span>
                    <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Телефон</span>
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      placeholder="+380 67 123 45 67"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      pattern="\+?[0-9 ()\-]{10,18}"
                      title="Номер телефону, напр. +380 67 123 45 67"
                      autoComplete="tel"
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Пошта</span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="name@example.com"
                    />
                  </label>
                </div>
              </section>

              <section className={styles.card} id="delivery" aria-labelledby="c-delivery">
                <h2 id="c-delivery" className={styles.h2}>
                  Доставка
                </h2>
                {needsDelivery ? (
                  <>
                    <div className={styles.carrier}>
                      <span className={styles.logoTile}>
                        <img src="/pay/np.webp" alt="Нова пошта" width={120} height={34} />
                      </span>
                      <span className={styles.carrierText}>Відділення або поштомат</span>
                    </div>
                    <NovaPoshta city={city} setCity={setCity} warehouse={warehouse} setWarehouse={setWarehouse} />
                  </>
                ) : (
                  <div className={styles.carrier}>
                    <span className={styles.logoTile} aria-hidden="true">
                      <svg viewBox="0 0 24 24" className={styles.tileIcon}>
                        <path d="M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M9 16h6" />
                      </svg>
                    </span>
                    <span className={styles.carrierText}>PDF та EPUB на сторінці замовлення</span>
                  </div>
                )}
              </section>

              <section className={styles.card} aria-labelledby="c-pay">
                <h2 id="c-pay" className={styles.h2}>
                  Оплата
                </h2>
                <div className={styles.pay} role="radiogroup" aria-labelledby="c-pay">
                  {available.filter((m) => m.enabled).map((m) => {
                    const info = PAY_INFO[m.id];
                    const on = chosen === m.id;
                    return (
                      <label key={m.id} className={`${styles.payOpt} ${on ? styles.payOn : ""}`}>
                        <input
                          type="radio"
                          name="pay"
                          value={m.id}
                          checked={on}
                          onChange={() => setMethod(m.id)}
                        />
                        <span className={styles.payDot} aria-hidden="true" />
                        <span className={styles.logoTile} aria-hidden="true">
                          {info.logo ? (
                            <img src={info.logo} alt="" />
                          ) : (
                            <svg viewBox="0 0 24 24" className={styles.tileIcon}>
                              <path d="M3 9.5L12 4l9 5.5 M5 10v8 M9.5 10v8 M14.5 10v8 M19 10v8 M3 20h18" />
                            </svg>
                          )}
                        </span>
                        <span className={styles.payTitle}>{info.title}</span>
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className={styles.card} aria-labelledby="c-comment">
                <label className={styles.field}>
                  <span id="c-comment" className={styles.label}>
                    Коментар до замовлення (необовʼязково)
                  </span>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Напр. підпис для подарунка чи зручний час дзвінка"
                  />
                </label>
              </section>
            </div>

            <aside className={styles.summary} aria-label="Підсумок" ref={summaryRef}>
              <h2 className={styles.h2}>Разом</h2>
              <dl className={styles.rows}>
                <div>
                  <dt>{books(count)}</dt>
                  <dd>{formatPrice(full, "UAH")}</dd>
                </div>
                {saved > 0 && (
                  <div className={styles.save}>
                    <dt>Знижка</dt>
                    <dd>−{formatPrice(saved, "UAH")}</dd>
                  </div>
                )}
                <div>
                  <dt>Доставка</dt>
                  <dd>{needsDelivery ? "за тарифом НП" : "не потрібна"}</dd>
                </div>
              </dl>
              <div className={styles.total}>
                <span>До сплати</span>
                <strong>{formatPrice(total, "UAH")}</strong>
              </div>

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className={`pill pill--solid ${styles.submit}`} disabled={busy}>
                {busy
                  ? "Оформлюємо…"
                  : chosen && ONLINE.includes(chosen)
                    ? `Оплатити ${formatPrice(total, "UAH")}`
                    : "Підтвердити замовлення"}
              </button>

              <div className={`${styles.phoneBar} ${summaryOn ? styles.phoneBarOff : ""}`} aria-hidden="true">
                <span>
                  <small>До сплати</small>
                  <b>{formatPrice(total, "UAH")}</b>
                </span>
                <button type="submit" className="pill pill--solid" disabled={busy} tabIndex={-1}>
                  {busy ? "Оформлюємо…" : chosen && ONLINE.includes(chosen) ? "Оплатити" : "Оформити"}
                </button>
              </div>

            </aside>
          </form>
        )}
      </div>
    </section>
  );
}
