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
          <p className={styles.tagline}>
            Бутикове видавництво книг про езотерику, містику й відьомство.
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

        <div className={styles.col}>
          <h4>Авторам</h4>
          <div className={styles.stack}>
            <Link href="/submissions" prefetch={false}>
              Умови прийому рукописів
            </Link>
            <a href={`mailto:${EMAIL}`}>Надіслати рукопис</a>
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
