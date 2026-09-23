"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ApiError,
  adminChangePassword,
  adminLogin,
  adminLogout,
  adminMe,
  getAdminStats,
  listSubmissions,
} from "@/lib/api";
import Drawer from "./Drawer";
import s from "./admin.module.css";

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

  useEffect(() => {
    if (!token) return;
    Promise.all([getAdminStats(token, true), listSubmissions(token)])
      .then(([st, subs]) =>
        setCounts({
          awaiting: st.by_status.awaiting_payment ?? 0,
          fresh: subs.filter((x) => (x.status ?? "new") === "new").length,
        }),
      )
      .catch(fail);
  }, [token, tick, fail]);

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
      </div>
    </AdminCtx.Provider>
  );
}
