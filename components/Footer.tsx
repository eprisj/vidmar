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

        <div className={styles.col}>
          <h4>Видавництво</h4>
          <div className={styles.stack}>
            <Link href="/about">Про нас</Link>
            <Link href="/genres">Напрями</Link>
            <Link href="/catalog">Каталог</Link>
            <Link href="/journal">Журнал</Link>
          </div>
        </div>

        <div className={styles.col}>
          <h4>Авторам</h4>
          <div className={styles.stack}>
            <Link href="/submissions">Умови прийому рукописів</Link>
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

      {/* the tagline right above already says "Бутикове видавництво" — this
          line carries only what it doesn't: where the publisher stands */}
      <div className={`wrapMax ${styles.legal}`}>
        <span>© 2026 ВІДЬМАР</span>
        <span>Перше видання — у підготовці</span>
      </div>
    </footer>
  );
}
