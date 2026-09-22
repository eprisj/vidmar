"use client";

import { useEffect, useState } from "react";
import { ApiError, getMe, login, logout, register, type User } from "@/lib/api";
import { useToast } from "./ToastProvider";
import Reveal from "./Reveal";
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
      setError(err instanceof ApiError ? err.message : "щось пішло не так, спробуйте ще раз");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.split}>
      <div className={styles.stack}>
        <Reveal>
          <span className="micro micro--bright">
            {mode === "login" ? "вхід" : "реєстрація"}
          </span>
        </Reveal>

        <form className={styles.form} onSubmit={submit}>
          {mode === "register" && <input name="name" type="text" placeholder="ваше ім'я" aria-label="Ваше ім'я" />}
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ваша пошта"
            aria-label="Ваша пошта"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "login" ? "пароль" : "пароль, від 8 символів"}
            aria-label="Пароль"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className="pill pill--solid" disabled={busy}>
            {busy ? "зачекайте…" : mode === "login" ? "Увійти" : "Створити акаунт"}
          </button>
          <button
            type="button"
            className={styles.switch}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Немає акаунту? Зареєструватись" : "Вже є акаунт? Увійти"}
          </button>
        </form>
      </div>

      <div className={`body ${styles.aside}`}>{aside}</div>
    </div>
  );
}
