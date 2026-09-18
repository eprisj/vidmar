"use client";

import { useEffect, useState } from "react";
import Seal from "./Seal";
import styles from "./Preloader.module.css";

export default function Preloader() {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setGone(true);
      return;
    }

    document.body.classList.add("is-loading");
    let value = 0;

    const timer = window.setInterval(() => {
      // ease toward 100 so the count slows as it fills
      value += Math.max(1, Math.round((100 - value) * 0.14));
      if (value >= 100) {
        value = 100;
        window.clearInterval(timer);
        window.setTimeout(() => setDone(true), 260);
        window.setTimeout(() => {
          setGone(true);
          document.body.classList.remove("is-loading");
        }, 1400);
      }
      setPct(value);
    }, 90);

    return () => {
      window.clearInterval(timer);
      document.body.classList.remove("is-loading");
    };
  }, []);

  if (gone) return null;

  return (
    <div className={`${styles.root} ${done ? styles.done : ""}`} aria-hidden="true">
      <div className={styles.in}>
        <Seal />
        <span className={styles.mark}>
          <span className={styles.word}>Відьмар</span>
          <span className={styles.pct}>{String(pct).padStart(3, "0")}</span>
        </span>
      </div>
      <div className={styles.bar}>
        <div className={styles.barIn} style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  );
}
