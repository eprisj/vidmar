import Link from "next/link";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={`ash ${styles.root}`} data-field="light">
      <div className={`wrapMax ${styles.mid}`}>
        <p className={`lede ${styles.note}`}>
          видаємо книги про езотерику, містику й відьомство.
        </p>

        <span className={styles.cue}>
          <span className="micro">прогорнути вниз</span>
          <span className={styles.cueLine} />
        </span>
      </div>

      <div>
        <div className={`wrapMax ${styles.foot}`}>
          <p className="micro">Перше видання — у підготовці</p>
          <Link className="pill" href="/submissions">
            Надіслати рукопис
          </Link>
        </div>
        <div className={styles.bleed}>
          <span className={styles.word}>відьмар</span>
          <span className={styles.wordBlur} aria-hidden="true">
            відьмар
          </span>
        </div>
      </div>
    </section>
  );
}
