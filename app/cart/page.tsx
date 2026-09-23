"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BookCover from "@/components/BookCover";
import {
  FORMAT_LABEL,
  apiMessage,
  formatPrice,
  getBooks,
  getMe,
  getPayMethods,
  npCities,
  npWarehouses,
  placeOrder,
  type Book,
  type NpCity,
  type NpWarehouse,
  type PayMethod,
  type PlacedOrder,
} from "@/lib/api";
import { cartCount, clearCart, patchLine, readCart, removeLine, setQuantity, useCart, type CartLine } from "@/lib/cart";
import { ONLINE, PAY_INFO } from "@/lib/payments";
import styles from "./cart.module.css";

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/** +380 67 123 45 67, typed however the buyer likes */
function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0")) d = "38" + d;
  if (d && !d.startsWith("380")) return raw.startsWith("+") ? raw : "+" + d;
  d = d.slice(0, 12);
  const parts = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean);
  return d ? "+" + parts.join(" ") : "";
}

const books = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} книга`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} книги`;
  return `${n} книг`;
};

/** City by typing, then a branch from that city's list, both straight from
 * Nova Poshta through our API. */
function NovaPoshta({
  city,
  setCity,
  warehouse,
  setWarehouse,
}: {
  city: NpCity | null;
  setCity: (c: NpCity | null) => void;
  warehouse: NpWarehouse | null;
  setWarehouse: (w: NpWarehouse | null) => void;
}) {
  const [cityQ, setCityQ] = useState("");
  const [cities, setCities] = useState<NpCity[]>([]);
  const [open, setOpen] = useState(false);
  const [whQ, setWhQ] = useState("");
  const [whs, setWhs] = useState<NpWarehouse[]>([]);
  const dq = useDebounced(cityQ);
  const dw = useDebounced(whQ);

  useEffect(() => {
    if (city || dq.trim().length < 2) return setCities([]);
    npCities(dq).then(setCities);
  }, [dq, city]);

  useEffect(() => {
    if (!city) return setWhs([]);
    npWarehouses(city.ref, dw).then(setWhs);
  }, [city, dw]);

  return (
    <div className={styles.np}>
      <div className={styles.field}>
        <span className={styles.label}>Місто</span>
        {city ? (
          <span className={styles.picked}>
            <span>
              {city.name} <small>{city.area} обл.</small>
            </span>
            <button
              type="button"
              onClick={() => {
                setCity(null);
                setWarehouse(null);
                setCityQ("");
              }}
            >
              змінити
            </button>
          </span>
        ) : (
          <span className={styles.combo}>
            <input
              value={cityQ}
              onChange={(e) => {
                setCityQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Почніть вводити, напр. Вінниця"
              autoComplete="address-level2"
              aria-label="Місто"
            />
            {open && cities.length > 0 && (
              <ul className={styles.options} role="listbox">
                {cities.map((c) => (
                  <li key={c.ref}>
                    <button
                      type="button"
                      onClick={() => {
                        setCity(c);
                        setOpen(false);
                      }}
                    >
                      {c.name} <small>{c.area} обл.</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </span>
        )}
      </div>

      {city && (
        <div className={styles.field}>
          <span className={styles.label}>Відділення або поштомат</span>
          {warehouse ? (
            <span className={styles.picked}>
              <span>{warehouse.name}</span>
              <button type="button" onClick={() => setWarehouse(null)}>
                змінити
              </button>
            </span>
          ) : (
            <span className={styles.combo}>
              <input
                value={whQ}
                onChange={(e) => setWhQ(e.target.value)}
                placeholder="Номер або вулиця"
                aria-label="Відділення або поштомат"
              />
              <ul className={`${styles.options} ${styles.optionsStatic}`} role="listbox">
                {whs.map((w) => (
                  <li key={w.ref}>
                    <button type="button" onClick={() => setWarehouse(w)}>
                      {w.name}
                    </button>
                  </li>
                ))}
                {whs.length === 0 && <li className={styles.empty}>Нічого не знайшлось</li>}
              </ul>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

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
          {sku && <span className={styles.sku}>SKU {sku}</span>}
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
      <p className={styles.hint}>
        Збережіть посилання на сторінку замовлення: там статус, номер накладної і файли електронних книг.
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

  useEffect(() => {
    setMounted(true);
    getMe()
      .then((u) => {
        setEmail((e) => e || u.email);
        setName((n) => n || u.name || "");
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
                <p className={styles.hint}>Щоб звʼязатися щодо замовлення. Жодних розсилок без вашої згоди.</p>
              </section>

              <section className={styles.card} id="delivery" aria-labelledby="c-delivery">
                <h2 id="c-delivery" className={styles.h2}>
                  Доставка
                </h2>
                {needsDelivery ? (
                  <>
                    <div className={styles.carrier}>
                      <span className={styles.carrierMark} aria-hidden="true">
                        НП
                      </span>
                      <span>
                        <b>Нова пошта, відділення або поштомат</b>
                        <small>1–3 дні після відправлення, вартість за тарифом перевізника</small>
                      </span>
                    </div>
                    <NovaPoshta city={city} setCity={setCity} warehouse={warehouse} setWarehouse={setWarehouse} />
                  </>
                ) : (
                  <div className={styles.carrier}>
                    <span className={styles.carrierMark} aria-hidden="true">
                      @
                    </span>
                    <span>
                      <b>Електронна доставка</b>
                      <small>PDF та EPUB відкриються на сторінці замовлення одразу після оплати</small>
                    </span>
                  </div>
                )}
              </section>

              <section className={styles.card} aria-labelledby="c-pay">
                <h2 id="c-pay" className={styles.h2}>
                  Оплата
                </h2>
                <div className={styles.pay} role="radiogroup" aria-labelledby="c-pay">
                  {available.map((m) => {
                    const info = PAY_INFO[m.id];
                    const on = chosen === m.id;
                    return (
                      <label
                        key={m.id}
                        className={`${styles.payOpt} ${on ? styles.payOn : ""} ${m.enabled ? "" : styles.payOff}`}
                      >
                        <input
                          type="radio"
                          name="pay"
                          value={m.id}
                          checked={on}
                          disabled={!m.enabled}
                          onChange={() => setMethod(m.id)}
                        />
                        <span className={styles.payDot} aria-hidden="true" />
                        <span className={styles.payBody}>
                          <span className={styles.payTitle}>
                            {info.title}
                            {!m.enabled && <em>підключаємо</em>}
                          </span>
                          <span className={styles.payNote}>{info.note}</span>
                          <span className={styles.marks}>
                            {info.marks.map((mk) => (
                              <span key={mk}>{mk}</span>
                            ))}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {!onlyPrint && methods.some((m) => m.id === "cod") && (
                  <p className={styles.hint}>Накладений платіж доступний, коли в кошику лише паперові книги.</p>
                )}
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

            <aside className={styles.summary} aria-label="Підсумок">
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

              <ul className={styles.trust}>
                {chosen && ONLINE.includes(chosen) && (
                  <li>Дані картки вводяться на захищеній сторінці банку, ми їх не бачимо</li>
                )}
                {chosen === "iban" && <li>Реквізити зʼявляться на сторінці замовлення одразу після оформлення</li>}
                {chosen === "cod" && <li>Платите лише тоді, коли забираєте посилку</li>}
                <li>Без реєстрації: сторінка замовлення відкривається за посиланням</li>
                {needsDelivery && <li>Номер накладної зʼявиться на сторінці замовлення</li>}
              </ul>
            </aside>
          </form>
        )}
      </div>
    </section>
  );
}
