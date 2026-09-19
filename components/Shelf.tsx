import shelf from "@/assets/shelf/shelf.svg";
import Reveal from "./Reveal";
import styles from "./Shelf.module.css";

/**
 * The boutique shelf: one lamp-lit engraving (scripts/shelf.mjs) standing in
 * for the whole "бутикове видавництво" line — a shelf, not a warehouse. The
 * copy sits in the lamp's own pool of light, the one empty column the shelf
 * generator leaves for it.
 */
export default function Shelf() {
  return (
    <section className={`ink ${styles.root}`} data-field="dark" data-candle="">
      <img
        className={styles.plate}
        src={shelf.src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
      />
      <div className={`wrapMax ${styles.in}`}>
        <Reveal className={styles.copy}>
          <span className="micro micro--bright">атмосфера</span>
          <h2 className={styles.title}>Полиця, а не склад</h2>
          <p className={`body ${styles.lede}`}>
            Бутикове видавництво означає: не вал накладів, а кілька книжок,
            які хочеться тримати на видноті. Саме так ми уявляємо кожен наш
            тираж.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
