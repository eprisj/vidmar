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
        {/* the page's actual h1: the wordmark is the heading, not decoration
            repeating the logo above it. The blurred copy is the same word
            going out of focus, so it stays hidden from assistive tech. */}
        {/* the page's actual h1: the wordmark is the heading, not decoration
            repeating the logo above it. The out-of-focus copy is drawn from
            data-word through CSS content, so the heading holds the name once
            in the DOM — as a second text node it made the h1 read
            "відьмарвідьмар" to anything extracting text. */}
        <h1 className={styles.bleed}>
          <span className={styles.word}>відьмар</span>
          <span
            className={styles.wordBlur}
            data-word="відьмар"
            aria-hidden="true"
          />
        </h1>
      </div>
    </section>
  );
}
