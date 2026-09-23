"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import AuthGate from "@/components/AuthGate";
import BookCover from "@/components/BookCover";
import NovaPoshta, { formatPhone } from "@/components/NovaPoshta";
import ReaderCard from "@/components/ReaderCard";
import { useToast } from "@/components/ToastProvider";
import {
  changePassword,
  formatPrice,
  listMyOrders,
  updateMe,
  type MyOrder,
  type NpCity,
  type NpWarehouse,
  type User,
} from "@/lib/api";
import { PAY_INFO } from "@/lib/payments";
import styles from "./account.module.css";

const STATUS: Record<string, { text: string; tone: string }> = {
  awaiting_payment: { text: "Очікує оплати", tone: "wait" },
  paid: { text: "Оплачено", tone: "ok" },
  shipped: { text: "У дорозі", tone: "ok" },
  fulfilled: { text: "Виконано", tone: "done" },
  cancelled: { text: "Скасовано", tone: "off" },
};

const SECTIONS = [
  ["orders", "Замовлення"],
  ["card", "Картка читача"],
  ["profile", "Профіль"],
  ["delivery", "Доставка"],
  ["security", "Безпека"],
] as const;

function Orders() {
  const [orders, setOrders] = useState<MyOrder[] | null>(null);

  useEffect(() => {
    listMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  if (orders === null) return <div className={styles.skeleton} aria-busy="true" />;

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Замовлень поки немає.</p>
        <Link className="pill pill--solid" href="/catalog">
          До каталогу
        </Link>
      </div>
    );
  }

  return (
    <ul className={styles.orders}>
      {orders.map((o) => {
        const st = STATUS[o.status] ?? { text: o.status, tone: "wait" };
        const count = o.items.reduce((n, i) => n + i.quantity, 0);
        const href = o.access_token ? `/order?id=${o.id}&t=${o.access_token}` : null;
        const body = (
          <>
            <span className={styles.covers} aria-hidden="true">
              {o.items.slice(0, 3).map((i, k) => (
                <span key={k} className={styles.cover}>
                  <BookCover title={i.title} src={i.cover_url} pos={i.cover_pos} size="small" />
                </span>
              ))}
            </span>
            <span className={styles.orderInfo}>
              <span className={styles.orderTop}>
                <b>№{o.id}</b>
                <span className={`${styles.status} ${styles[st.tone]}`}>{st.text}</span>
              </span>
              <span className={styles.orderTitles}>{o.items.map((i) => i.title).join(", ")}</span>
              <span className={styles.orderMeta}>
                {new Date(o.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
                {" · "}
                {count} {count === 1 ? "книга" : count < 5 ? "книги" : "книг"}
                {o.payment_method && ` · ${PAY_INFO[o.payment_method]?.title ?? ""}`}
                {o.ttn && ` · ТТН ${o.ttn}`}
              </span>
            </span>
            <span className={styles.orderSum}>{formatPrice(o.total_cents, o.currency)}</span>
          </>
        );
        return (
          <li key={o.id}>
            {href ? (
              <Link href={href} prefetch={false} className={styles.order}>
                {body}
                <span className={styles.chev} aria-hidden="true">
                  →
                </span>
              </Link>
            ) : (
              <div className={styles.order}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Profile({ user, onSaved }: { user: User; onSaved: (u: User) => void }) {
  const toast = useToast();
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty = name !== (user.name || "") || phone !== (user.phone || "");

  return (
    <form
      className={styles.form}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          onSaved(await updateMe({ name, phone }));
          toast("профіль збережено");
        } catch (err) {
          setError(err instanceof Error ? err.message : "не вдалося зберегти");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className={styles.field}>
        <span>Імʼя та прізвище</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <div className={styles.row2}>
        <label className={styles.field}>
          <span>Пошта</span>
          <input value={user.email} readOnly aria-readonly="true" className={styles.readonly} />
        </label>
        <label className={styles.field}>
          <span>Телефон</span>
          <input
            type="tel"
            inputMode="tel"
            placeholder="+380 67 123 45 67"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            autoComplete="tel"
          />
        </label>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.formEnd}>
        <button type="submit" className="pill pill--solid" disabled={busy || !dirty}>
          {busy ? "Зберігаємо…" : "Зберегти"}
        </button>
      </div>
    </form>
  );
}

function Delivery({ user, onSaved }: { user: User; onSaved: (u: User) => void }) {
  const toast = useToast();
  const d = user.delivery;
  const [city, setCity] = useState<NpCity | null>(d ? { ref: d.cityRef, name: d.cityName, area: d.area || "" } : null);
  const [warehouse, setWarehouse] = useState<NpWarehouse | null>(
    d ? { ref: d.warehouseRef, name: d.warehouseName, number: "" } : null,
  );
  const [busy, setBusy] = useState(false);
  const changed = (warehouse?.ref ?? null) !== (d?.warehouseRef ?? null);

  async function save(clear = false) {
    setBusy(true);
    try {
      const u = await updateMe({
        delivery:
          clear || !city || !warehouse
            ? null
            : { cityRef: city.ref, cityName: city.name, area: city.area, warehouseRef: warehouse.ref, warehouseName: warehouse.name },
      });
      onSaved(u);
      if (clear) {
        setCity(null);
        setWarehouse(null);
      }
      toast(clear ? "адресу прибрано" : "адресу збережено");
    } catch (err) {
      toast(err instanceof Error ? err.message : "не вдалося зберегти");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.form}>
      <NovaPoshta city={city} setCity={setCity} warehouse={warehouse} setWarehouse={setWarehouse} />
      <div className={styles.formEnd}>
        {d && (
          <button type="button" className={styles.textBtn} disabled={busy} onClick={() => save(true)}>
            Прибрати адресу
          </button>
        )}
        <button type="button" className="pill pill--solid" disabled={busy || !warehouse || !changed} onClick={() => save()}>
          {busy ? "Зберігаємо…" : "Зберегти адресу"}
        </button>
      </div>
    </div>
  );
}

function Security({ user, onSaved }: { user: User; onSaved: (u: User) => void }) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [news, setNews] = useState(!!user.newsletter);

  return (
    <div className={styles.securityGrid}>
      <form
        className={styles.form}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await changePassword(current, next);
            setCurrent("");
            setNext("");
            toast("пароль змінено, інші пристрої вийшли з акаунта");
          } catch (err) {
            setError(err instanceof Error ? err.message : "не вдалося змінити пароль");
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className={styles.subhead}>Пароль</span>
        {/* lets the browser's password manager tie the new password to this account */}
        <input type="email" value={user.email} autoComplete="username" readOnly hidden />
        <label className={styles.field}>
          <span>Поточний пароль</span>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label className={styles.field}>
          <span>Новий пароль, від 8 символів</span>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.formEnd}>
          <button type="submit" className="pill" disabled={busy || !current || next.length < 8}>
            {busy ? "Змінюємо…" : "Змінити пароль"}
          </button>
        </div>
      </form>

      <div className={styles.form}>
        <span className={styles.subhead}>Розсилка</span>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            role="switch"
            checked={news}
            onChange={async (e) => {
              const v = e.target.checked;
              setNews(v);
              try {
                onSaved(await updateMe({ newsletter: v }));
                toast(v ? "ви підписані на новини" : "підписку скасовано");
              } catch {
                setNews(!v);
                toast("не вдалося змінити підписку");
              }
            }}
          />
          <span className={styles.switch} aria-hidden="true" />
          <span>
            <b>Новини видавництва</b>
          </span>
        </label>
      </div>
    </div>
  );
}

function Cabinet({ user: initial, signOut }: { user: User; signOut: () => void }) {
  const [user, setUser] = useState(initial);
  const first = (user.name || "").split(" ")[0];

  return (
    <div className={styles.cabinet}>
      <header className={styles.top}>
        <div>
          <h2 className={styles.hello}>{first ? `Вітаємо, ${first}` : "Вітаємо"}</h2>
          <p className={styles.email}>{user.email}</p>
        </div>
        <button type="button" className="pill" onClick={signOut}>
          Вийти
        </button>
      </header>

      <nav className={styles.tabs} aria-label="Розділи кабінету">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>

      <div className={styles.grid}>
        <div className={styles.main}>
          <section id="orders" className={styles.panel}>
            <h3 className={styles.h3}>Замовлення</h3>
            <Orders />
          </section>

          <section id="profile" className={styles.panel}>
            <h3 className={styles.h3}>Профіль</h3>
            <Profile user={user} onSaved={setUser} />
          </section>

          <section id="delivery" className={styles.panel}>
            <h3 className={styles.h3}>Доставка за замовчуванням</h3>
            <Delivery user={user} onSaved={setUser} />
          </section>

          <section id="security" className={styles.panel}>
            <h3 className={styles.h3}>Безпека й розсилка</h3>
            <Security user={user} onSaved={setUser} />
          </section>
        </div>

        <aside id="card" className={styles.side}>
          {user.reader_code && <ReaderCard code={user.reader_code} name={user.name} createdAt={user.created_at} />}
        </aside>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <>
      <PageHero label="Кабінет" title="Ваш кабінет" variant={2} compact />

      <section className={`ink ${styles.root}`} data-field="dark">
        <div className="wrapMax">
          <AuthGate
            aside={<p>Історія замовлень, збережена адреса доставки й картка читача з QR-кодом.</p>}
          >
            {(user, signOut) => <Cabinet user={user} signOut={signOut} />}
          </AuthGate>
        </div>
      </section>
    </>
  );
}
