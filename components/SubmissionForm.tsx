"use client";

import { useState } from "react";
import { genres } from "@/lib/content";
import { apiMessage, submitManuscript } from "@/lib/api";
import styles from "./SubmissionForm.module.css";

const NOTE_MAX = 2000;

/**
 * A letter to the editors: labelled fields (placeholders vanish as you type
 * and leave the field unnamed), the direction as chips rather than a select
 * that cut its own label off, and a sealed thank-you once it is sent.
 */
export default function SubmissionForm() {
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [genre, setGenre] = useState("");
  const [note, setNote] = useState("");

  if (status === "done") {
    return (
      <div className={`${styles.letter} ${styles.sent}`} role="status">
        <span className={styles.sealBig} aria-hidden="true" />
        <h3 className={styles.sentTitle}>Лист у нас</h3>
        <p className={styles.sentText}>
          Дякуємо, що довірили нам свій текст. Ми уважно прочитаємо опис і відповімо на вашу пошту. Рукопис лишається
          вашим, і ми не передаємо його нікому.
        </p>
      </div>
    );
  }

  return (
    <form
      className={styles.letter}
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setStatus("busy");
        setError("");
        try {
          await submitManuscript({
            name: String(data.get("name") || ""),
            email: String(data.get("email") || ""),
            title: String(data.get("title") || ""),
            genre,
            note,
          });
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
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Ваше імʼя</span>
          <input name="name" type="text" required autoComplete="name" />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Пошта для відповіді</span>
          <input name="email" type="email" required autoComplete="email" inputMode="email" />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>
          Назва рукопису <i>необовʼязково</i>
        </span>
        <input name="title" type="text" />
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
              onClick={() => setGenre((cur) => (cur === g.slug ? "" : g.slug))}
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
          onChange={(e) => setNote(e.target.value)}
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
        <button type="submit" className={`pill pill--solid ${styles.send}`} disabled={status === "busy"}>
          {status === "busy" ? "Надсилаємо…" : "Надіслати лист"}
          <span aria-hidden="true">→</span>
        </button>
        <span className={styles.promise}>Рукопис лишається вашим. Ми не передаємо його третім особам.</span>
      </div>
    </form>
  );
}
