"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BookCover from "@/components/BookCover";
import {
  FORMAT_LABEL,
  apiMessage,
  formatPrice,
  getMe,
  npCities,
  npWarehouses,
  placeOrder,
  type NpCity,
  type NpWarehouse,
  type PlacedOrder,
} from "@/lib/api";
import { clearCart, removeLine, setQuantity, useCart } from "@/lib/cart";
import styles from "./cart.module.css";

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

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
      <label className={styles.field}>
        <span>Місто</span>
        {city ? (
          <span className={styles.picked}>
            {city.name} <small>{city.area} обл.</small>
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
      </label>

      {city && (
        <label className={styles.field}>
          <span>Відділення або поштомат</span>
          {warehouse ? (
            <span className={styles.picked}>
              {warehouse.name}
              <button type="button" onClick={() => setWarehouse(null)}>
                змінити
              </button>
            </span>
          ) : (
            <span className={styles.combo}>
              <input value={whQ} onChange={(e) => setWhQ(e.target.value)} placeholder="Номер або вулиця" />
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
        </label>
      )}
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setMounted(true);
    getMe()
      .then((u) => {
        setEmail((e) => e || u.email);
        setName((n) => n || u.name || "");
      })
      .catch(() => {});
  }, []);

  const needsDelivery = lines.some((l) => l.format === "print");
  const total = lines.reduce((s, l) => s + l.price_cents * l.quantity, 0);

  if (!mounted) return <section className={styles.root} />;

  if (placed) {
    const link = `/order?id=${placed.id}&t=${placed.access_token}`;
    return (
      <section className={styles.root} data-field="dark">
        <div className={`wrapMax ${styles.done}`}>
          <span className="micro micro--bright">замовлення №{placed.id}</span>
          <h1 className={styles.h1}>Дякуємо, замовлення прийнято</h1>
          <p className="body">
            Ми звʼяжемося з вами, щоб підтвердити його й надіслати реквізити для оплати. Сторінку замовлення
            можна відкрити будь-коли за посиланням нижче, збережіть його.
          </p>
          <Link className="pill pill--solid" href={link} prefetch={false}>
            Сторінка замовлення
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.root} data-field="dark">
      <div className="wrapMax">
        <h1 className={styles.h1}>Кошик</h1>

        {lines.length === 0 ? (
          <div className={styles.emptyCart}>
            <p className="body">Кошик порожній.</p>
            <Link className="pill" href="/catalog">
              До каталогу
            </Link>
          </div>
        ) : (
          <div className={styles.layout}>
            <ul className={styles.lines}>
              {lines.map((l) => (
                <li key={`${l.slug}-${l.format}`} className={styles.line}>
                  <Link href={`/book?s=${l.slug}`} prefetch={false} className={styles.thumb}>
                    <BookCover title={l.title} src={l.cover_url} pos={l.cover_pos} size="small" />
                  </Link>
                  <div className={styles.lineInfo}>
                    <Link href={`/book?s=${l.slug}`} prefetch={false} className={styles.lineTitle}>
                      {l.title}
                    </Link>
                    <span className={styles.lineMeta}>
                      {FORMAT_LABEL[l.format]} · {formatPrice(l.price_cents, "UAH")}
                    </span>
                    <div className={styles.lineCtl}>
                      {l.format === "print" ? (
                        <span className={styles.qty}>
                          <button
                            type="button"
                            aria-label="Менше"
                            onClick={() => setQuantity(l.slug, l.format, l.quantity - 1)}
                          >
                            −
                          </button>
                          <span aria-live="polite">{l.quantity}</span>
                          <button
                            type="button"
                            aria-label="Більше"
                            onClick={() => setQuantity(l.slug, l.format, l.quantity + 1)}
                          >
                            +
                          </button>
                        </span>
                      ) : (
                        <span className={styles.lineMeta}>PDF + EPUB</span>
                      )}
                      <button type="button" className={styles.remove} onClick={() => removeLine(l.slug, l.format)}>
                        Прибрати
                      </button>
                    </div>
                  </div>
                  <span className={styles.lineSum}>{formatPrice(l.price_cents * l.quantity, "UAH")}</span>
                </li>
              ))}
            </ul>

            <form
              ref={formRef}
              className={styles.checkout}
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                if (needsDelivery && (!city || !warehouse)) {
                  setError("Оберіть місто й відділення Нової пошти");
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
                  });
                  clearCart();
                  setPlaced(order);
                  window.scrollTo({ top: 0 });
                } catch (err) {
                  setError(err instanceof Error ? err.message : apiMessage(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <h2 className={styles.h2}>Оформлення</h2>

              <label className={styles.field}>
                <span>Імʼя та прізвище</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </label>
              <label className={styles.field}>
                <span>Телефон</span>
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  placeholder="+380"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className={styles.field}>
                <span>Пошта</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>

              {needsDelivery ? (
                <>
                  <h3 className={styles.h3}>Доставка Новою поштою</h3>
                  <NovaPoshta city={city} setCity={setCity} warehouse={warehouse} setWarehouse={setWarehouse} />
                </>
              ) : (
                <p className={styles.hint}>Електронні книги надійдуть на пошту й у кабінет після оплати.</p>
              )}

              <label className={styles.field}>
                <span>Коментар (необовʼязково)</span>
                <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
              </label>

              <div className={styles.sum}>
                <span>Разом</span>
                <strong>{formatPrice(total, "UAH")}</strong>
              </div>
              {needsDelivery && <p className={styles.hint}>Вартість доставки за тарифами Нової пошти, сплачується при отриманні посилки.</p>}

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="pill pill--solid" disabled={busy}>
                {busy ? "Оформлюємо…" : "Підтвердити замовлення"}
              </button>
              <p className={styles.hint}>
                Реєстрація не потрібна. Реквізити для оплати надішлемо після підтвердження.
              </p>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
