import Link from "next/link";
import { EMAIL } from "@/lib/content";
import styles from "./Footer.module.css";

const sections = [
  { href: "/about", label: "Про нас" },
  { href: "/genres", label: "Напрями" },
  { href: "/submissions", label: "Авторам" },
  { href: "/journal", label: "Журнал" },
];

export default function Footer() {
  return (
    <footer className={styles.root} data-field="dark">
      <div className={`wrapMax ${styles.grid}`}>
        <div className={styles.brand}>
          <span className={styles.mark} role="img" aria-label="ВІДЬМАР" />
          <p className={styles.tagline}>
            Бутикове видавництво книг про езотерику, містику й відьомство.
          </p>
        </div>

        <nav className={styles.nav} aria-label="Розділи">
          {sections.map((s) => (
            <Link key={s.href} href={s.href}>
              {s.label}
            </Link>
          ))}
        </nav>

        {/* one address, said once — "Надіслати рукопис" was the same mailto
            under a second heading */}
        <div className={styles.write}>
          <span className="micro">Написати нам</span>
          <a className={styles.email} href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
          <Link className={styles.rules} href="/submissions">
            Умови прийому рукописів
          </Link>
        </div>
      </div>

      {/* the tagline above already says "Бутикове видавництво" — this line
          carries only what it doesn't: where the publisher stands */}
      <div className={`wrapMax ${styles.legal}`}>
        <span>© 2026 ВІДЬМАР</span>
        <span>Перше видання — у підготовці</span>
      </div>
    </footer>
  );
}
