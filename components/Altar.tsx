import altar from "@/assets/altar/altar.svg";
import Reveal from "./Reveal";
import Seal from "./Seal";
import styles from "./Altar.module.css";

/**
 * The ritual altar: candles, an open grimoire lettered with the house's own
 * heptagram, a hand of cards, a crystal, herbs and a stick of incense —
 * engraved the same way the hero's forest and the boutique shelf are
 * (scripts/altar.mjs, committed SVG, no build-time cost). Where the shelf
 * showed the house's stock, this shows how a text is actually handled:
 * slowly, one at a time, not run through a formula.
 */
export default function Altar() {
  return (
    <section className={`ink-2 ${styles.root}`} data-field="dark" data-candle="">
      <img
        className={styles.plate}
        src={altar.src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
      />
      <div className={`wrapMax ${styles.in}`}>
        <Reveal className={styles.copy}>
          <span className={styles.star} aria-hidden="true">
            <Seal ticks={0} emblem />
          </span>
          <span className={styles.circle} aria-hidden="true" />
          <span className="micro micro--bright">ремесло</span>
          <h2 className={styles.title}>Не формула, а обряд</h2>
          <p className={`body ${styles.lede}`}>
            Кожен рукопис, який ми беремо в роботу, проходить свій шлях
            уважно й повільно.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
