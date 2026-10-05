"use client";

import { useEffect, useState } from "react";
import { genres } from "@/lib/content";
import { apiMessage, submitManuscript } from "@/lib/api";
import styles from "./SubmissionForm.module.css";

const NOTE_MAX = 2000;
// an unsent letter waits in this browser: a long description is not lost to a closed tab
const DRAFT = "vidmar_submission_draft";
type Draft = {
  name: string;
  email: string;
  title: string;
  genre: string;
  note: string;
};
const EMPTY: Draft = { name: "", email: "", title: "", genre: "", note: "" };

/**
 * A letter to the editors: labelled fields (placeholders vanish as you type
 * and leave the field unnamed), the direction as chips rather than a select
 * that cut its own label off, and a sealed thank-you once it is sent.
 */
export default function SubmissionForm() {
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [d, setD] = useState<Draft>(EMPTY);
  const [restored, setRestored] = useState(false);
  const set = (k: keyof Draft, v: string) =>
    setD((cur) => ({ ...cur, [k]: v }));
  const { genre, note } = d;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT) || "null");
      if (saved && typeof saved === "object") {
        setD({ ...EMPTY, ...saved });
        if (saved.note || saved.title) setRestored(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (Object.values(d).some(Boolean))
          localStorage.setItem(DRAFT, JSON.stringify(d));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [d]);

  if (status === "done") {
    return (
      <div className={`${styles.letter} ${styles.sent}`} role="status">
        <span className={styles.stamp} aria-hidden="true">
          <span className={styles.ripple} />
          <span className={styles.sealBig} />
        </span>
        <h3 className={styles.sentTitle}>Лист у нас</h3>
        <p className={styles.sentText}>
          Дякуємо, що довірили нам свій текст. Ми уважно прочитаємо опис і
          відповімо на вашу пошту. Рукопис лишається вашим, і ми не передаємо
          його нікому.
        </p>
      </div>
    );
  }

  return (
    <form
      className={styles.letter}
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("busy");
        setError("");
        try {
          await submitManuscript({
            name: d.name,
            email: d.email,
            title: d.title,
            genre,
            note,
          });
          try {
            localStorage.removeItem(DRAFT);
          } catch {}
          setStatus("done");
        } catch (err) {
          setError(apiMessage(err));
          setStatus("error");
        }
      }}
    >
      <div className={styles.head}>
        <span className={styles.seal} aria-hidden="true" />
        <span className={styles.kicker}>Лист до редакції</span>
        {restored && <span className={styles.draft}>чернетку відновлено</span>}
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Ваше імʼя</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            value={d.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Пошта для відповіді</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={d.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>
          Назва рукопису <i>необовʼязково</i>
        </span>
        <input
          name="title"
          type="text"
          value={d.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </label>

      <fieldset className={styles.chips}>
        <legend className={styles.label}>
          Напрям <i>необовʼязково</i>
        </legend>
        <div className={styles.chipRow}>
          {genres.map((g) => (
            <button
              key={g.slug}
              type="button"
              className={`${styles.chip} ${genre === g.slug ? styles.chipOn : ""}`}
              aria-pressed={genre === g.slug}
              onClick={() => set("genre", genre === g.slug ? "" : g.slug)}
            >
              {g.title}
            </button>
          ))}
        </div>
      </fieldset>

      <label className={styles.field}>
        <span className={styles.label}>Про рукопис і про себе</span>
        <textarea
          name="note"
          required
          rows={6}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="Про що текст, який обсяг, чи виходили ваші книги раніше. Додайте посилання на рукопис (Google Docs, Dropbox тощо)."
        />
        <span className={styles.count} aria-live="polite">
          {note.length > NOTE_MAX * 0.8 ? `${note.length} / ${NOTE_MAX}` : ""}
        </span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.foot}>
        <button
          type="submit"
          className={`pill pill--solid ${styles.send}`}
          disabled={status === "busy"}
        >
          {status === "busy" ? "Надсилаємо…" : "Надіслати лист"}
          <span aria-hidden="true">→</span>
        </button>
        <span className={styles.promise}>
          Рукопис лишається вашим. Ми не передаємо його третім особам.
        </span>
      </div>
    </form>
  );
}
