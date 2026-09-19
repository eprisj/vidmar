"use client";

import { useMemo, useState } from "react";
import { tarotDeck } from "@/lib/content";
import Seal from "./Seal";
import styles from "./CardOfTheDay.module.css";

/** Same card for everyone, all day — a stable pick beats a reshuffle on
 * every visit, since "картка дня" only means something if the day agrees
 * with itself. Local date, not UTC: the card should turn over at midnight
 * where the reader actually is. */
function pickToday() {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return tarotDeck[h % tarotDeck.length];
}

export default function CardOfTheDay() {
  const card = useMemo(pickToday, []);
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={`${styles.stage} ${open ? styles.open : ""}`}
        onClick={() => setOpen(true)}
        aria-label={open ? card.name : "Витягнути карту дня"}
        aria-live="polite"
      >
        <span className={styles.card}>
          <span className={styles.face}>
            <span className={styles.ring} aria-hidden="true">
              <Seal ticks={48} star />
            </span>
          </span>
          <span className={styles.back}>
            <img className={styles.img} src={`/vidmar/tarot/${card.file}.webp`} alt="" aria-hidden="true" />
          </span>
        </span>
      </button>

      <div className={styles.copy}>
        {open ? (
          <>
            <span className="micro micro--bright">картка дня</span>
            <h3 className={styles.name}>{card.name}</h3>
            <p className={`body ${styles.meaning}`}>{card.meaning}</p>
          </>
        ) : (
          <>
            <span className="micro micro--bright">картка дня</span>
            <p className={`body ${styles.prompt}`}>
              Одна карта, та сама для всіх сьогодні. Натисніть, щоб перевернути.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
