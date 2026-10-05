"use client";

import Link from "next/link";
import { useState } from "react";
import { apiMessage, subscribe } from "@/lib/api";
import { GENRE_PLATE } from "@/lib/plates";
import styles from "./CatalogEmpty.module.css";

/** "Tell me when it is out": the newsletter, asked for right where the shelf is bare. */
export function NotifyForm({ cta = "Повідомити мене" }: { cta?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");
  if (state === "done") {
    return (
      <p className={styles.done} role="status">
        Готово! Напишемо на {email}, щойно зʼявиться нова книга.
      </p>
    );
  }
  return (
    <form
      className={styles.notify}
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        setError("");
        try {
          await subscribe(email);
          setState("done");
        } catch (err) {
          setError(apiMessage(err));
          setState("error");
        }
      }}
    >
      <label className={styles.srOnly} htmlFor="notify-email">
        Ваша пошта
      </label>
      <input
        id="notify-email"
        type="email"
        required
        placeholder="ваша пошта"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" className="pill pill--solid" disabled={state === "busy"}>
        {state === "busy" ? "…" : cta}
      </button>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </form>
  );
}

type Props = {
  genre: { slug: string; title: string } | null;
  q: string;
  format: "all" | "print" | "ebook";
  onReset: () => void;
};

/** A filter that finds nothing: say why, offer the way back, and a way to hear first. */
export default function CatalogEmpty({ genre, q, format, onReset }: Props) {
  const plate = genre ? GENRE_PLATE[genre.slug] : "witches-storm";
  const query = q.trim();

  let title = "Тут поки порожньо";
  let text = "Спробуйте інший напрям чи формат.";
  if (query) {
    title = `За запитом «${query}» нічого`;
    text = "Перевірте написання або шукайте за автором чи назвою книги.";
  } else if (genre) {
    title = `«${genre.title}»: книги вже готуються`;
    text =
      format === "all"
        ? "Перші видання цього напряму зараз у роботі. Залиште пошту – повідомимо, щойно вийдуть."
        : `У форматі «${format === "print" ? "папір" : "e-book"}» тут ще нічого немає. Погляньте інші формати або залиште пошту.`;
  } else if (format !== "all") {
    title = format === "print" ? "Паперових видань ще немає" : "Електронних видань ще немає";
    text = "Вони зʼявляться згодом. Поки погляньте інший формат.";
  }

  return (
    <div className={styles.box}>
      <div className={styles.plate} aria-hidden="true">
        <img
          src={`/gravure/${plate}-2xs.webp`}
          srcSet={`/gravure/${plate}-2xs.webp 360w, /gravure/${plate}-xs.webp 560w`}
          sizes="220px"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span className={styles.seal} />
      </div>
      <div className={styles.copy}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.text}>{text}</p>
        <div className={styles.actions}>
          <button type="button" className="pill" onClick={onReset}>
            Показати всі книги
          </button>
          {genre && (
            <Link className={styles.link} href={`/genres#${genre.slug}`} prefetch={false}>
              Про напрям →
            </Link>
          )}
        </div>
        {!query && <NotifyForm />}
        {genre && !query && (
          <p className={styles.author}>
            Пишете в цьому напрямі? <Link href="/submissions" prefetch={false}>Надішліть рукопис</Link>
          </p>
        )}
      </div>
    </div>
  );
}
