import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import {
  EMAIL,
  focusText,
  founderLetter,
  genres,
  positioning,
  submissionNote,
} from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import styles from "./about.module.css";

export const metadata: Metadata = pageMeta(
  "Про нас — ВІДЬМАР",
  "ВІДЬМАР — бутикове видавництво книг про езотерику, містику й відьомство. Лист засновника, напрями видавництва та умови прийому рукописів.",
  "/about",
);

export default function AboutPage() {
  return (
    <>
      <section className="ink" data-field="dark">
        <div className={`wrapMax ${styles.head}`}>
          <p className="micro micro--bright">Видавництво</p>
          <h1 className={styles.title}>ВІДЬМАР</h1>
        </div>

        <div className={`wrapMax ${styles.grid}`}>
          <Reveal>
            <div
              className={styles.plate}
              role="img"
              aria-label="Знак ВІДЬМАР, тиснений золотом на палітурній тканині"
            />
          </Reveal>
          <Reveal delay={110}>
            <div className={styles.copy}>
              <p className={styles.manifest}>{positioning}</p>
              <p className="body">{focusText}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* the founder's letter, in full */}
      <section className="ink-2 pad" data-field="dark">
        <div className="wrapMax">
          <Reveal>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                flexWrap: "wrap",
                marginBottom: "clamp(28px,4vw,48px)",
              }}
            >
              <span className="micro">лист засновника</span>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <h2 className={styles.pull}>Вітаю у ВІДЬМАР!</h2>
          </Reveal>

          <Reveal delay={140}>
            <div className={styles.letter}>
              {founderLetter.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={190}>
            <div className={styles.signoff}>
              <b>Засновник видавництва ВІДЬМАР</b>
              <span>та Марія — партнерка, яка колись закохала мене в читання</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* what we publish */}
      <section className="ink pad" data-field="dark">
        <div className="wrapMax">
          <Reveal>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                flexWrap: "wrap",
                marginBottom: "clamp(20px,3vw,36px)",
              }}
            >
              <span className="micro">що ми видаємо</span>
            </div>
          </Reveal>

          <div className={styles.genreList}>
            {genres.map((g, i) => (
              <Reveal key={g.slug} delay={i * 50}>
                <div className={styles.genreRow}>
                  <span className={styles.genreName}>{g.title}</span>
                  {g.note && <span className="micro micro--bright">{g.note}</span>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* submissions */}
      <section className="ash pad" data-field="light">
        <div className="wrapMax">
          <Reveal>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                flexWrap: "wrap",
                marginBottom: "clamp(20px,3vw,36px)",
              }}
            >
              <span className="micro">для авторів</span>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <p className="body" style={{ maxWidth: "62ch" }}>
              {submissionNote} Якщо у вас є готовий рукопис — надсилайте його
              та інформацію про себе на пошту. Будемо знайомитися.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
              <a className="pill pill--solid" href={`mailto:${EMAIL}`}>
                Написати на {EMAIL}
              </a>
              <Link className="pill pill--bare" href="/submissions">
                Умови прийому рукописів
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
