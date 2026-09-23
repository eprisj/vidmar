"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BookCover from "@/components/BookCover";
import {
  FORMAT_LABEL,
  ebookUrl,
  formatPrice,
  getPayMethods,
  lookupOrder,
  payOrder,
  type PayMethod,
  type PublicOrder,
} from "@/lib/api";
import { ONLINE, PAY_INFO } from "@/lib/payments";
import styles from "./order.module.css";

const PAID = ["paid", "shipped", "fulfilled"];

function headline(o: PublicOrder) {
  if (o.status === "cancelled") return "Замовлення скасовано";
  if (o.status === "fulfilled") return "Замовлення виконано";
  if (o.status === "shipped") return "Посилка в дорозі";
  if (o.status === "paid") return o.items.every((i) => i.format === "ebook") ? "Оплачено, книги доступні" : "Оплачено, готуємо посилку";
  if (o.payment_method === "cod") return "Прийнято, оплата при отриманні";
  return "Очікує оплати";
}

function Steps({ o }: { o: PublicOrder }) {
  const digital = o.items.every((i) => i.format === "ebook");
  const cod = o.payment_method === "cod";
  const steps = digital
    ? ["Оформлено", "Оплачено", "Файли доступні"]
    : cod
      ? ["Оформлено", "Відправлено", "Отримано й оплачено"]
      : ["Оформлено", "Оплачено", "Відправлено", "Отримано"];
  const at = digital
    ? PAID.includes(o.status) ? 2 : 0
    : cod
      ? { awaiting_payment: 0, paid: 0, shipped: 1, fulfilled: 2 }[o.status] ?? 0
      : { awaiting_payment: 0, paid: 1, shipped: 2, fulfilled: 3 }[o.status] ?? 0;
  return (
    <ol className={styles.steps} aria-label="Етапи замовлення">
      {steps.map((s, i) => (
        <li key={s} className={i <= at ? styles.stepOn : ""} aria-current={i === at ? "step" : undefined}>
          <span className={styles.stepDot} aria-hidden="true" />
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function Copy({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={styles.copy}
      aria-label={`Скопіювати: ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked: the value is on screen to select by hand */
        }
      }}
    >
      {done ? "скопійовано" : "копіювати"}
    </button>
  );
}

function Payment({ o, token, back }: { o: PublicOrder; token: string; back: boolean }) {
  const [online, setOnline] = useState<PayMethod[]>([]);
  const [busy, setBusy] = useState<PayMethod | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPayMethods().then((m) => setOnline(m.filter((x) => x.enabled && ONLINE.includes(x.id)).map((x) => x.id)));
  }, []);

  if (o.status !== "awaiting_payment") {
    if (!o.paid_at) return null;
    return (
      <div className={`${styles.panel} ${styles.paidPanel}`}>
        <span className={styles.panelTitle}>Оплачено</span>
        <span className={styles.muted}>
          {new Date(o.paid_at).toLocaleString("uk-UA", { dateStyle: "long", timeStyle: "short" })} ·{" "}
          {PAY_INFO[o.payment_method]?.title}
        </span>
      </div>
    );
  }

  const go = async (m: PayMethod) => {
    setBusy(m);
    setError("");
    try {
      window.location.assign(await payOrder(o.id, token, m));
    } catch (err) {
      setError(err instanceof Error ? err.message : "не вдалося відкрити оплату");
      setBusy(null);
    }
  };

  const purpose = `Оплата замовлення №${o.id}`;
  const amount = formatPrice(o.total_cents, o.currency);

  return (
    <div className={styles.panel}>
      <span className={styles.panelTitle}>Оплата</span>

      {o.payment_method === "cod" && (
        <p className={styles.muted}>
          Накладений платіж: {amount} сплачуєте у відділенні Нової пошти, коли забираєте посилку. Пошта додає
          свою комісію за переказ.
        </p>
      )}

      {ONLINE.includes(o.payment_method) && back && (
        <p className={styles.notice}>
          Банк ще не підтвердив оплату. Якщо ви вже заплатили, статус оновиться сам протягом хвилини.
        </p>
      )}

      {o.payment_method === "iban" &&
        (o.requisites ? (
          <dl className={styles.req}>
            {(
              [
                ["Отримувач", o.requisites.recipient],
                ["IBAN", o.requisites.iban],
                ["ЄДРПОУ / РНОКПП", o.requisites.edrpou],
                ["Банк", o.requisites.bank],
                ["Сума", amount],
                ["Призначення", purpose],
              ] as [string, string | null][]
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>
                    <span className={k === "IBAN" ? styles.mono : ""}>{v}</span>
                    {k !== "Банк" && <Copy value={k === "Сума" ? String(o.total_cents / 100) : v!} label={k} />}
                  </dd>
                </div>
              ))}
          </dl>
        ) : (
          <p className={styles.muted}>
            Реквізити для переказу надішлемо на вашу пошту найближчим часом. Призначення платежу: «{purpose}».
          </p>
        ))}

      {o.payment_method !== "cod" && online.length > 0 && (
        <div className={styles.payBtns}>
          {o.payment_method === "iban" && <span className={styles.muted}>Або оплатіть онлайн:</span>}
          {online.map((m) => (
            <button
              key={m}
              type="button"
              className={`pill ${m === o.payment_method || (o.payment_method === "iban" && m === online[0]) ? "pill--solid" : ""}`}
              disabled={busy !== null}
              onClick={() => go(m)}
            >
              {busy === m ? "Відкриваємо…" : `${PAY_INFO[m].title} · ${amount}`}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function OrderView() {
  const params = useSearchParams();
  const [order, setOrder] = useState<PublicOrder | null | undefined>(undefined);
  const id = params.get("id") || "";
  const token = params.get("t") || "";
  const back = params.get("back") === "1";

  const load = useCallback(() => lookupOrder(id, token).then((o) => (setOrder(o), o)), [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  // back from the bank's page: the webhook may land a few seconds later
  useEffect(() => {
    if (!back || !order || order.status !== "awaiting_payment" || !ONLINE.includes(order.payment_method)) return;
    let n = 0;
    const t = setInterval(async () => {
      const o = await load();
      if (++n >= 15 || (o && o.status !== "awaiting_payment")) clearInterval(t);
    }, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [back, order?.status]);

  if (order === undefined) return <div className={styles.loading} aria-busy="true" />;
  if (order === null)
    return (
      <div className={styles.missing}>
        <h1 className={styles.h1}>Замовлення не знайдено</h1>
        <p className="body">Перевірте посилання: воно має містити номер замовлення й ключ доступу.</p>
        <Link className="pill" href="/catalog">
          До каталогу
        </Link>
      </div>
    );

  const count = order.items.reduce((n, i) => n + i.quantity, 0);
  const paid = PAID.includes(order.status);

  return (
    <>
      <header className={styles.head}>
        <span className="micro micro--bright">
          замовлення №{order.id} · {new Date(order.created_at).toLocaleDateString("uk-UA", { dateStyle: "long" })}
        </span>
        <h1 className={styles.h1}>{headline(order)}</h1>
        {order.status !== "cancelled" && <Steps o={order} />}
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          <Payment o={order} token={token} back={back} />

          <section className={styles.panel}>
            <span className={styles.panelTitle}>Книги</span>
            <ul className={styles.items}>
              {order.items.map((i, k) => (
                <li key={k} className={styles.item}>
                  <span className={styles.thumb}>
                    <BookCover title={i.title} src={i.cover_url} pos={i.cover_pos} size="small" />
                  </span>
                  <span className={styles.itemInfo}>
                    {i.slug ? (
                      <Link href={`/book?s=${i.slug}`} prefetch={false} className={styles.itemTitle}>
                        {i.title}
                      </Link>
                    ) : (
                      <span className={styles.itemTitle}>{i.title}</span>
                    )}
                    <span className={styles.itemMeta}>
                      <span className={styles.muted}>
                        {FORMAT_LABEL[i.format]}
                        {i.quantity > 1 && ` × ${i.quantity}`}
                      </span>
                      {i.sku && (
                        <span className="skuTag">
                          <i>Арт.</i>
                          {i.sku}
                        </span>
                      )}
                    </span>
                    {i.format === "ebook" && i.slug && (
                      <span className={styles.files}>
                        {paid ? (
                          <>
                            {i.has_pdf && (
                              <a className="pill" href={ebookUrl(order.id, token, i.slug, "pdf")}>
                                Завантажити PDF
                              </a>
                            )}
                            {i.has_epub && (
                              <a className="pill" href={ebookUrl(order.id, token, i.slug, "epub")}>
                                EPUB
                              </a>
                            )}
                            {!i.has_pdf && !i.has_epub && (
                              <span className={styles.muted}>Файл готуємо, він зʼявиться тут</span>
                            )}
                          </>
                        ) : (
                          <span className={styles.muted}>Завантаження відкриється тут після оплати</span>
                        )}
                      </span>
                    )}
                  </span>
                  <span className={styles.itemSum}>{formatPrice(i.price_cents * i.quantity, order.currency)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={styles.side}>
          <section className={styles.panel}>
            <span className={styles.panelTitle}>Підсумок</span>
            <dl className={styles.rows}>
              <div>
                <dt>Книг</dt>
                <dd>{count}</dd>
              </div>
              <div>
                <dt>Оплата</dt>
                <dd>{PAY_INFO[order.payment_method]?.title ?? order.payment_method}</dd>
              </div>
              <div>
                <dt>Доставка</dt>
                <dd>{order.np_warehouse ? "Нова пошта" : "електронна"}</dd>
              </div>
            </dl>
            <div className={styles.total}>
              <span>Разом</span>
              <strong>{formatPrice(order.total_cents, order.currency)}</strong>
            </div>
          </section>

          {order.np_warehouse && (
            <section className={styles.panel}>
              <span className={styles.panelTitle}>Доставка</span>
              <p className={styles.addr}>
                <b>{order.customer_name}</b>
                <br />
                {order.np_city}
                <br />
                {order.np_warehouse}
              </p>
              {order.ttn ? (
                <div className={styles.ttn}>
                  <span className={styles.muted}>Номер накладної</span>
                  <span className={styles.ttnRow}>
                    <b className={styles.mono}>{order.ttn}</b>
                    <Copy value={order.ttn} label="номер накладної" />
                  </span>
                  <a
                    className={styles.track}
                    href={`https://novaposhta.ua/tracking/?cargo_number=${order.ttn}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Відстежити на сайті Нової пошти →
                  </a>
                </div>
              ) : (
                <p className={styles.muted}>Номер накладної зʼявиться тут після відправлення.</p>
              )}
            </section>
          )}

          <p className={styles.keep}>
            Збережіть це посилання: воно відкриває замовлення без входу в кабінет. Питання щодо замовлення:{" "}
            <a href={`mailto:vidmarpublishing@gmail.com?subject=Замовлення №${order.id}`}>vidmarpublishing@gmail.com</a>
          </p>
        </aside>
      </div>
    </>
  );
}

export default function OrderPage() {
  return (
    <section className={styles.root} data-field="dark">
      <div className="wrapMax">
        <Suspense fallback={<div className={styles.loading} />}>
          <OrderView />
        </Suspense>
      </div>
    </section>
  );
}
