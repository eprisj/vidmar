import Link from "next/link";
import { EMAIL } from "@/lib/content";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={`ink ${styles.root}`} data-field="dark">
      <div className={`wrapMax ${styles.grid}`}>
        <div className={styles.col}>
          <span
            className={styles.mark}
            role="img"
            aria-label="ВІДЬМАР"
          />
          {/* "Бутикове видавництво" is already said twice above the fold —
              under the wordmark and again as the whole point of the shelf
              section. Here the line carries only what it publishes. */}
          <p className={styles.tagline}>
            Книги про езотерику, містику й відьомство.
          </p>
        </div>

        {/* prefetch off throughout: the footer sits at the foot of every
            page, so its five links pulled a payload for all five routes on
            every visit — about 300KB a phone spends before it taps anything */}
        <div className={styles.col}>
          <h4>Видавництво</h4>
          <div className={styles.stack}>
            <Link href="/about" prefetch={false}>Про нас</Link>
            <Link href="/genres" prefetch={false}>Напрями</Link>
            <Link href="/catalog" prefetch={false}>Каталог</Link>
            <Link href="/journal" prefetch={false}>Журнал</Link>
          </div>
        </div>

        {/* Two links to one act, and the one labelled "Надіслати рукопис"
            opened a mail client — walking past the submission form that page
            actually holds. Both now lead to the form, which carries the
            conditions and the address anyway. */}
        <div className={styles.col}>
          <h4>Авторам</h4>
          <div className={styles.stack}>
            <Link href="/submissions" prefetch={false}>
              Надіслати рукопис
            </Link>
          </div>
        </div>

        <div className={styles.col}>
          <h4>Написати нам</h4>
          <div className={styles.stack}>
            <a className={styles.big} href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          </div>
        </div>
      </div>

      {/* the tagline right above already says "Бутикове видавництво" – this
          line carries only what it doesn't: where the publisher stands */}
      <div className={`wrapMax ${styles.legal}`}>
        <span>© 2026 ВІДЬМАР</span>
        <span>Перше видання – у підготовці</span>
      </div>
    </footer>
  );
}
