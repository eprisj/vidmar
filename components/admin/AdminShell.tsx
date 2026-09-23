"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ApiError, getAdminStats, listSubmissions } from "@/lib/api";
import s from "./admin.module.css";

const TOKEN_KEY = "vidmar-admin-token";

type Ctx = {
  token: string;
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
};

export function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={s.icon} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Login({ onToken }: { onToken: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className={s.loginWrap}>
      <form
        className={s.login}
        onSubmit={(e) => {
          e.preventDefault();
          if (v.trim()) onToken(v.trim());
        }}
      >
        <span className={s.brand} role="img" aria-label="ВІДЬМАР" />
        <h1 className={s.loginTitle}>Адміністрування</h1>
        <label className={s.field}>
          <span>Ключ доступу</span>
          <input
            type="password"
            value={v}
            onChange={(e) => setV(e.target.value)}
            autoComplete="current-password"
            autoFocus
          />
        </label>
        <button type="submit" className={s.btnPrimary}>
          Увійти
        </button>
      </form>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/admin";
  const [token, setToken] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ awaiting: number; fresh: number }>({ awaiting: 0, fresh: 0 });
  const [tick, setTick] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    try {
      setToken(localStorage.getItem(TOKEN_KEY) || "");
    } catch {
      setToken("");
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
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
        <Login
          onToken={(t) => {
            try {
              localStorage.setItem(TOKEN_KEY, t);
            } catch {}
            setToken(t);
          }}
        />
      </div>
    );
  }

  const nav = [
    { href: "/admin", label: "Огляд", icon: I.home },
    { href: "/admin/orders", label: "Замовлення", icon: I.orders, badge: counts.awaiting },
    { href: "/admin/books", label: "Книги", icon: I.books },
    { href: "/admin/users", label: "Читачі", icon: I.users },
    { href: "/admin/manuscripts", label: "Рукописи", icon: I.scripts, badge: counts.fresh },
    { href: "/admin/subscribers", label: "Розсилка", icon: I.subs },
  ];
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <AdminCtx.Provider value={{ token, logout, fail, refreshCounts: () => setTick((n) => n + 1) }}>
      <div className={s.app} data-admin-app="">
        <aside className={`${s.side} ${menu ? s.sideOpen : ""}`}>
          <div className={s.sideTop}>
            <Link href="/admin" className={s.brandLink} aria-label="Огляд">
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
            <button type="button" className={s.navItem} onClick={logout}>
              <Icon d={I.out} />
              <span>Вийти</span>
            </button>
          </div>
        </aside>
        <main className={s.main}>{children}</main>
      </div>
    </AdminCtx.Provider>
  );
}
