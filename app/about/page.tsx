import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import Smoke from "@/components/Smoke";
import Seal from "@/components/Seal";
import LitText from "@/components/LitText";
import Marquee from "@/components/Marquee";
import GenreRows from "@/components/GenreRows";
import SubmitBlock from "@/components/SubmitBlock";
import ScrollProgress from "@/components/ScrollProgress";
import { focusText, founderLetter, genres, positioning } from "@/lib/content";
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
      <PageHero label="Видавництво" title="ВІДЬМАР" lede={focusText} variant={1} />

      {/* the mark itself: the one warm object on the site */}
      <ScrollProgress className={`ink pad ${styles.brand}`} data-field="dark" data-candle="">
        <div className={`wrapMax ${styles.grid}`}>
          <Reveal>
            <div className={styles.plateWrap}>
              <div
                className={styles.plate}
                role="img"
                aria-label="Знак ВІДЬМАР, тиснений золотом на палітурній тканині"
              />
              <span className={styles.plateRing} aria-hidden="true">
                <Seal star={false} />
              </span>
            </div>
          </Reveal>
          <Reveal delay={110}>
            <div className={styles.copy}>
              <span className="micro micro--bright">хто ми</span>
              <p className={styles.manifest}>{positioning}</p>
              <p className="body">
                Бутикове — це значить небагато назв і кожна зроблена так,
                ніби вона єдина. Книги, які хочеться тримати в руках, а не
                прогортати.
              </p>
            </div>
          </Reveal>
        </div>
      </ScrollProgress>

      {/* the founder's letter, lit word by word as it is read */}
      <section className={`ink-2 pad ${styles.letterScene}`} data-field="dark" data-candle="">
        <Smoke intensity={0.5} source={[0.1, 0.0]} tint={[0.62, 0.5, 0.3]} />
        <div className={`wrapMax ${styles.letterIn}`}>
          <Reveal>
            <span className="micro micro--bright">лист засновника</span>
          </Reveal>

          <Reveal delay={80}>
            <h2 className={styles.pull}>Вітаю у ВІДЬМАР!</h2>
          </Reveal>

          <div className={styles.letter}>
            {founderLetter.map((paragraph) => (
              <LitText key={paragraph.slice(0, 24)} text={paragraph} className={styles.letterLit} />
            ))}
          </div>

          <Reveal>
            <div className={styles.signoff}>
              <span className={styles.signStar} aria-hidden="true">
                <Seal ticks={0} emblem />
              </span>
              <div>
                <b>Засновник видавництва ВІДЬМАР</b>
                <span>та Марія — партнерка, яка колись закохала мене в читання</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="ink" data-field="dark">
        <Marquee words={genres.map((g) => g.title)} />
      </section>

      {/* what we publish */}
      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          <Reveal>
            <span className="micro micro--bright">що ми видаємо</span>
          </Reveal>
          <div style={{ marginTop: "clamp(28px,4vw,56px)" }}>
            <GenreRows genres={genres} />
          </div>
        </div>
      </section>

      <SubmitBlock />
    </>
  );
}
