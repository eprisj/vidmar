"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ApiError,
  adminChangePassword,
  adminLogin,
  adminLogout,
  adminMe,
  getOrdersAfter,
  getPulse,
} from "@/lib/api";
import Drawer from "./Drawer";
import CommandPalette from "./CommandPalette";
import Publish from "./Publish";
import { requestOpen } from "./openRequest";
import { uah } from "./labels";
import p from "./plus.module.css";
import x from "./extra.module.css";
import s from "./admin.module.css";

/** Fired on window when new orders arrive, so an open orders table reloads itself. */
export const NEW_ORDERS_EVENT = "vidmar-admin-new-orders";
const PULSE_MS = 45_000;
const PAY: Record<string, string> = { mono: "monobank", liqpay: "LiqPay", iban: "на рахунок", cod: "накладений платіж" };

type Toast = { id: number; total_cents: number; customer_name: string | null; payment_method: string | null };

type Ctx = {
  /** the signed-in admin's login (requests travel on the session cookie) */
  token: string;
  /** where the admin lives, read from the address itself so it is written
   * nowhere in the code: "/<secret>" */
  base: string;
  logout: () => void;
  /** a page calls this on a 401 so the shell asks for the token again */
  fail: (err: unknown) => string;
  /** bumped after a change elsewhere, so the sidebar counts refresh */
  refreshCounts: () => void;
};

const AdminCtx = createContext<Ctx | null>(null);

export function useAdmin() {
  const c = useContext(AdminCtx);
  if (!c) throw new Error("useAdmin outside AdminShell");
  return c;
}

const I = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  orders: "M6 3h12l1 4H5zM5 7h14v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM9 11h6",
  books: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-4-5.6",
  subs: "M4 5h16v14H4zM4 6l8 7 8-7",
  scripts: "M14 3H6v18h12V7zM14 3v4h4M9 12h6M9 16h6",
  out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
  site: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  key: "M15 7a4 4 0 1 1-3.9 4.9L4 19v2h3v-2h2v-2h2l1.1-1.1A4 4 0 0 1 15 7zM16 9h.01",
  content: "M4 5h16M4 10h16M4 15h10M4 20h7M17 14l3 3-5 5h-3v-3z",
  reports: "M6 3h9l4 4v14H6zM14 3v5h5M9 17v-3M12 17v-6M15 17v-4",
  promo: "M3 12V4h8l10 10-8 8zM7.5 7.5h.01",
  seo: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4M8 11h6M11 8v6",
  journal: "M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  team: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
};

export function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={s.icon} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Login({ onIn }: { onIn: (login: string) => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className={s.loginWrap}>
      <form
        className={s.login}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            onIn((await adminLogin(login.trim(), password)).login);
          } catch (err) {
            setError(err instanceof Error ? err.message : "не вдалося увійти");
            setPassword("");
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className={s.brand} role="img" aria-label="ВІДЬМАР" />
        <h1 className={s.loginTitle}>Вхід в адміністрування</h1>
        <label className={s.field}>
          <span>Логін</span>
          <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoFocus required />
        </label>
        <label className={s.field}>
          <span>Пароль</span>
          <span className={s.pwWrap}>
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="button" className={s.pwEye} onClick={() => setShow(!show)} aria-label={show ? "Сховати пароль" : "Показати пароль"}>
              <svg viewBox="0 0 24 24" width="18" height="18" className={s.icon} aria-hidden="true">
                <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
                {show && <path d="M4 20L20 4" />}
              </svg>
            </button>
          </span>
        </label>
        {error && <p className={s.error}>{error}</p>}
        <button type="submit" className={s.btnPrimary} disabled={busy || !login || !password}>
          {busy ? "Перевіряємо…" : "Увійти"}
        </button>
      </form>
    </div>
  );
}

function PasswordDrawer({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = next.length >= 14 && next === again;
  return (
    <Drawer
      title="Змінити пароль"
      sub="Мінімум 14 символів. Інші відкриті сесії завершаться."
      onClose={onClose}
      foot={
        <button
          type="button"
          className={s.btnPrimary}
          disabled={busy || !current || !ok}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await adminChangePassword(current, next);
              setMsg("Пароль змінено.");
              setCurrent("");
              setNext("");
              setAgain("");
            } catch (e) {
              setError(e instanceof Error ? e.message : "не вдалося");
            } finally {
              setBusy(false);
            }
          }}
        >
          Змінити
        </button>
      }
    >
      {error && <p className={s.error}>{error}</p>}
      {msg && <p className={s.muted}>{msg}</p>}
      <label className={s.field}>
        <span>Поточний пароль</span>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
      </label>
      <label className={s.field}>
        <span>Новий пароль</span>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
      </label>
      <label className={s.field}>
        <span>Ще раз</span>
        <input type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
      </label>
      {again && next !== again && <span className={s.dim}>Паролі не збігаються</span>}
    </Drawer>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const base = "/" + (path.split("/")[1] || "");
  const [token, setToken] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [counts, setCounts] = useState<{ awaiting: number; fresh: number }>({ awaiting: 0, fresh: 0 });
  const [tick, setTick] = useState(0);
  const [menu, setMenu] = useState(false);
  const [find, setFind] = useState(false);

  useEffect(() => {
    // a key from the old token sign-in has no use any more
    try {
      localStorage.removeItem("vidmar-admin-token");
    } catch {}
    adminMe()
      .then((me) => setToken(me?.login ?? ""))
      .catch(() => setToken(""));
  }, []);

  const logout = useCallback(() => {
    adminLogout();
    setToken("");
  }, []);

  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && /unauthorized|401/.test(err.message)) logout();
      return err instanceof Error ? err.message : "щось пішло не так";
    },
    [logout],
  );

  /* The pulse: a cheap poll while the tab is open. It keeps the sidebar counts
     fresh and, when an order id above the last one seen shows up, raises a toast
     and puts the number of unseen orders in the tab title. The first answer only
     sets the mark, so opening the admin never replays old orders. */
  const seen = useRef<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unseen, setUnseen] = useState(0);
  useEffect(() => {
    if (!token) return;
    let stop = false;
    const beat = async () => {
      if (document.hidden && seen.current !== null) return;
      try {
        const pl = await getPulse(token);
        if (stop) return;
        setCounts({ awaiting: pl.awaiting, fresh: pl.fresh });
        if (seen.current === null) seen.current = pl.last_order_id;
        else if (pl.last_order_id > seen.current) {
          const fresh = await getOrdersAfter(token, seen.current);
          seen.current = pl.last_order_id;
          if (stop || !fresh.length) return;
          setToasts((t) => [...fresh.slice(-3).reverse(), ...t].slice(0, 3));
          if (document.hidden) setUnseen((n) => n + fresh.length);
          window.dispatchEvent(new CustomEvent(NEW_ORDERS_EVENT));
        }
      } catch (e) {
        fail(e);
      }
    };
    beat();
    const t = setInterval(beat, PULSE_MS);
    const onVisible = () => {
      if (!document.hidden) {
        setUnseen(0);
        beat();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, tick, fail]);

  // "(2) …" in the tab title while new orders wait unseen in a background tab
  useEffect(() => {
    const clean = document.title.replace(/^\(\d+\) /, "");
    document.title = unseen ? `(${unseen}) ${clean}` : clean;
  }, [unseen, path]);

  useEffect(() => setMenu(false), [path]);

  if (token === null) return <div className={s.app} data-admin-app="" />;

  if (!token) {
    return (
      <div className={s.app} data-admin-app="">
        <Login onIn={setToken} />
      </div>
    );
  }

  const nav = [
    { href: base, label: "Огляд", icon: I.home },
    { href: `${base}/orders`, label: "Замовлення", icon: I.orders, badge: counts.awaiting },
    { href: `${base}/books`, label: "Книги", icon: I.books },
    { href: `${base}/users`, label: "Читачі", icon: I.users },
    { href: `${base}/manuscripts`, label: "Рукописи", icon: I.scripts, badge: counts.fresh },
    { href: `${base}/subscribers`, label: "Розсилка", icon: I.subs },
    { href: `${base}/content`, label: "Контент", icon: I.content },
    { href: `${base}/promos`, label: "Промокоди", icon: I.promo },
    { href: `${base}/seo`, label: "SEO", icon: I.seo },
    { href: `${base}/reports`, label: "Звіти", icon: I.reports },
    { href: `${base}/audit`, label: "Журнал дій", icon: I.journal },
    { href: `${base}/team`, label: "Команда", icon: I.team },
    { href: `${base}/settings`, label: "Налаштування", icon: I.settings },
  ];
  const active = (href: string) => (href === base ? path === base : path.startsWith(href));

  return (
    <AdminCtx.Provider value={{ token, base, logout, fail, refreshCounts: () => setTick((n) => n + 1) }}>
      <div className={s.app} data-admin-app="">
        <aside className={`${s.side} ${menu ? s.sideOpen : ""}`}>
          <div className={s.sideTop}>
            <Link href={base} className={s.brandLink} aria-label="Огляд">
              <span className={s.brand} role="img" aria-label="ВІДЬМАР" />
            </Link>
            <span className={s.sideTag}>адмін</span>
            <button type="button" className={s.burger} aria-label="Меню" aria-expanded={menu} onClick={() => setMenu(!menu)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={menu ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
              </svg>
            </button>
          </div>
          <button type="button" className={p.searchBtn} onClick={() => setFind(true)}>
            <Icon d={I.search} size={16} />
            <span>Пошук</span>
            <span className={p.kbd}>Ctrl K</span>
          </button>
          <nav className={s.nav}>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className={`${s.navItem} ${active(n.href) ? s.navOn : ""}`}>
                <Icon d={n.icon} />
                <span>{n.label}</span>
                {!!n.badge && <em className={s.badge}>{n.badge}</em>}
              </Link>
            ))}
          </nav>
          <div className={s.sideFoot}>
            <Publish token={token} base={base} tick={tick} fail={fail} className={s.navItem} />
            <a href="/" className={s.navItem} target="_blank" rel="noopener noreferrer">
              <Icon d={I.site} />
              <span>Відкрити сайт</span>
            </a>
            <button type="button" className={s.navItem} onClick={() => setPwOpen(true)}>
              <Icon d={I.key} />
              <span>Змінити пароль</span>
            </button>
            <button type="button" className={s.navItem} onClick={logout}>
              <Icon d={I.out} />
              <span>Вийти · {token}</span>
            </button>
          </div>
        </aside>
        <main className={s.main}>{children}</main>
        {pwOpen && <PasswordDrawer onClose={() => setPwOpen(false)} />}
        <CommandPalette token={token} base={base} nav={nav} open={find} setOpen={setFind} />
        {toasts.length > 0 && (
          <div className={x.toasts} role="status" aria-live="polite">
            {toasts.map((t) => (
              <div key={t.id} className={x.toast}>
                <Link
                  href={`${base}/orders?open=${t.id}`}
                  className={x.toastBody}
                  onClick={() => {
                    requestOpen("orders", t.id);
                    setToasts((all) => all.filter((y) => y.id !== t.id));
                  }}
                >
                  <span className={x.toastTitle}>Нове замовлення №{t.id}</span>
                  <span>
                    {t.customer_name || "Покупець"} · {uah(t.total_cents)}
                  </span>
                  {t.payment_method && <span className={s.dim}>{PAY[t.payment_method] ?? t.payment_method}</span>}
                </Link>
                <button
                  type="button"
                  className={x.toastClose}
                  aria-label="Закрити"
                  onClick={() => setToasts((all) => all.filter((y) => y.id !== t.id))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminCtx.Provider>
  );
}
