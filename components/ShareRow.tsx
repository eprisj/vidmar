"use client";

import { useState } from "react";
import { Icon } from "./JournalIcons";
import styles from "./ShareRow.module.css";

/** Two ways to pass a text on: into Telegram, or the address to the clipboard. */
export default function ShareRow({ url, title }: { url: string; title: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2200);
    } catch {
      window.prompt("Адреса тексту:", url);
    }
  };
  return (
    <div className={styles.row}>
      <span className={`micro ${styles.label}`}>поділитися</span>
      <a
        className={styles.btn}
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="telegram" size={18} />
        Telegram
      </a>
      <button type="button" className={styles.btn} onClick={copy} aria-live="polite">
        <Icon name={done ? "check" : "link"} size={18} />
        {done ? "Адресу скопійовано" : "Копіювати адресу"}
      </button>
    </div>
  );
}
