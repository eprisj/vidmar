import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { journalRubrics } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import styles from "./journal.module.css";
import { Txt } from "@/components/SiteText";

export const metadata: Metadata = pageMeta(
  "Журнал – ВІДЬМАР",
  "Журнал видавництва ВІДЬМАР – записи про підготовку першої книги зʼявляться тут ближче до випуску.",
  "/journal",
);

export default function JournalPage() {
  return (
    <>
      <PageHero
        compact
        label="Журнал"
        title={<Txt k="page.journal.title" />}
        variant={5}
      />

      {/* a real engraving standing in for the empty page — Macbeth and the
          three witches, 1860s Doré, rather than another textured panel */}
      <section className={`ink ${styles.plate}`} data-field="dark">
        <img
          className={styles.plateImg}
          src="/gravure/macbeth-cave.webp"
          srcSet="/gravure/macbeth-cave-sm.webp 780w, /gravure/macbeth-cave-md.webp 1200w, /gravure/macbeth-cave.webp 1761w"
          sizes="100vw"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      </section>

      {/* the three sections, shown as what they are: ruled, numbered and
          waiting — a table of contents with its lines not yet written */}
      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          <Reveal>
            <span className="micro micro--bright">зміст</span>
          </Reveal>
          <div className={styles.rubrics}>
            {journalRubrics.map((title, i) => (
              <Reveal key={title} delay={i * 90}>
                <article className={styles.rubric}>
                  <div className={styles.rubricBody}>
                    <h2 className={styles.rubricTitle}>{title}</h2>
                    <span className={styles.lines} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>
                  <span className={`micro ${styles.state}`}>Готується</span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
