"use client";

import { useEffect, useState } from "react";
import { apiMessage, getMe, login, logout, register, type User } from "@/lib/api";
import { useToast } from "./ToastProvider";
import GoogleButton from "./GoogleButton";
import styles from "./Shop.module.css";

type Props = {
  /** sits beside the form while signed out: what this account is even for */
  aside: React.ReactNode;
  children: (user: User, signOut: () => void) => React.ReactNode;
};

/** Gates a page behind the cookie session: shows a login/register form until
 * `/auth/me` resolves, then hands the resolved user to the page. Both cart
 * and account need the exact same gate, so it lives here once. */
export default function AuthGate({ aside, children }: Props) {
  const toast = useToast();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) return null;

  if (user) {
    return (
      <>
        {children(user, () => {
          logout();
          setUser(null);
        })}
      </>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "");
    const password = String(data.get("password") || "");
    const name = String(data.get("name") || "");
    setBusy(true);
    setError("");
    try {
      const account = mode === "login" ? await login(email, password) : await register(email, password, name);
      setUser(account);
      toast(mode === "login" ? "з поверненням" : "акаунт створено");
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.split}>
      <div className={styles.authCard}>
        <div className={styles.authTabs} role="tablist" aria-label="Вхід або реєстрація">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={mode === m ? styles.authTabOn : ""}
              onClick={() => {
                setMode(m);
                setError("");
              }}
            >
              {m === "login" ? "Вхід" : "Реєстрація"}
            </button>
          ))}
        </div>

        <GoogleButton
          mode={mode}
          onUser={(u) => {
            setUser(u);
            toast("ви увійшли через Google");
          }}
          onError={setError}
        />
        <div className={styles.or}>
          <span>або поштою</span>
        </div>

        <form className={styles.form} onSubmit={submit}>
          {mode === "register" && (
            <label className={styles.lf}>
              <span>Імʼя</span>
              <input name="name" type="text" autoComplete="name" />
            </label>
          )}
          <label className={styles.lf}>
            <span>Пошта</span>
            <input name="email" type="email" required autoComplete="email" inputMode="email" />
          </label>
          <label className={styles.lf}>
            <span>{mode === "login" ? "Пароль" : "Пароль, від 8 символів"}</span>
            <span className={styles.pw}>
              <input
                name="password"
                type={showPw ? "text" : "password"}
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className={styles.eye}
                aria-label={showPw ? "Сховати пароль" : "Показати пароль"}
                aria-pressed={showPw}
                onClick={() => setShowPw(!showPw)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPw && <path d="M4 20L20 4" />}
                </svg>
              </button>
            </span>
          </label>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className={`pill pill--solid ${styles.authSubmit}`} disabled={busy}>
            {busy ? "Зачекайте…" : mode === "login" ? "Увійти" : "Створити акаунт"}
          </button>
        </form>
      </div>

      <div className={`body ${styles.aside}`}>{aside}</div>
    </div>
  );
}
