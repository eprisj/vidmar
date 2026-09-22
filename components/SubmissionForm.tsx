"use client";

import { useState } from "react";
import { genres } from "@/lib/content";
import { apiMessage, submitManuscript } from "@/lib/api";
import styles from "./SubmissionForm.module.css";

export default function SubmissionForm() {
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (status === "done") {
    return (
      <p className={`body ${styles.done}`}>
        Дякуємо! Лист у нас – ми прочитаємо і відповімо на вашу пошту.
      </p>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        setStatus("busy");
        setError("");
        try {
          await submitManuscript({
            name: String(data.get("name") || ""),
            email: String(data.get("email") || ""),
            title: String(data.get("title") || ""),
            genre: String(data.get("genre") || ""),
            note: String(data.get("note") || ""),
          });
          setStatus("done");
        } catch (err) {
          setError(apiMessage(err));
          setStatus("error");
        }
      }}
    >
      <div className={styles.row}>
        <input name="name" type="text" required placeholder="ваше ім'я" aria-label="Ваше ім'я" />
        <input name="email" type="email" required placeholder="ваша пошта" aria-label="Ваша пошта" />
      </div>
      <div className={styles.row}>
        <input name="title" type="text" placeholder="назва рукопису" aria-label="Назва рукопису" />
        <select name="genre" defaultValue="" aria-label="Напрям">
          <option value="">напрям (необов&apos;язково)</option>
          {genres.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.title}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="note"
        required
        rows={5}
        placeholder="кілька слів про рукопис і про себе, посилання на текст"
        aria-label="Про рукопис"
      />
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className="pill pill--solid" disabled={status === "busy"}>
        {status === "busy" ? "надсилаємо…" : "Надіслати"}
      </button>
    </form>
  );
}
