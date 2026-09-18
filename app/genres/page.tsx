import type { Metadata } from "next";
import Link from "next/link";
import Atmosphere from "@/components/Atmosphere";
import Reveal from "@/components/Reveal";
import { EMAIL, genres } from "@/lib/content";
import styles from "./genres.module.css";

export const metadata: Metadata = {
  title: "Напрями — ВІДЬМАР",
  description:
    "Що видає ВІДЬМАР: езотерика, містика, відьомство й духовні практики, трилери, психологічні романи, фентезі та містична проза.",
};

export default function GenresPage() {
  return (
    <section className="ink" data-field="dark">
      <div className={`wrapMax ${styles.head}`}>
        <p className="micro">Напрями</p>
        <h1 className={styles.title}>Що ми видаємо</h1>
        <p className={`body ${styles.lede}`}>
          Основний напрям — езотерика, містика, відьомство та духовні
          практики. Також нам цікаві сильні, нестандартні тексти, яким часом
          затісно у звичних рамках великого видавничого ринку.
        </p>
      </div>

      <div className="wrapMax">
        {/* one mosaic of stone tiles, each in its own genre's colour — the
            two primary directions simply cut larger than the rest */}
        <div className={styles.mosaic}>
          {genres.map((g, i) => (
            <Reveal
              key={g.slug}
              delay={i * 70}
              className={`${styles.tile} ${g.primary ? styles.tilePrimary : styles.tileSecondary}`}
            >
              <Atmosphere tint={g.tint} variant={i} />
              <span className={styles.tileIndex}>{String(i + 1).padStart(2, "0")}</span>
              <div className={styles.tileIn}>
                {g.note && <span className="micro">{g.note}</span>}
                <span className={styles.tileTitle}>{g.title}</span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className={styles.footer}>
            <p className="body">Впізнали свій текст серед цих напрямів?</p>
            <div className={styles.cta}>
              <a className="pill pill--solid" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
              <Link className="pill pill--bare" href="/submissions">
                Умови прийому рукописів
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
