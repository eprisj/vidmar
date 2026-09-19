import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import ClosingBlock from "@/components/ClosingBlock";
import { journalRubrics } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import styles from "./journal.module.css";

export const metadata: Metadata = pageMeta(
  "Журнал — ВІДЬМАР",
  "Журнал видавництва ВІДЬМАР — записи про підготовку першої книги зʼявляться тут ближче до випуску.",
  "/journal",
);

export default function JournalPage() {
  return (
    <>
      <PageHero
        label="Журнал"
        title="Скоро тут будуть записи"
        lede="Журнал видавництва запрацює, коли вийде перша книга. Ось із чого він почнеться."
        variant={5}
      />

      {/* a real engraving standing in for the empty page — Macbeth and the
          three witches, 1860s Doré, rather than another textured panel */}
      <section className={`ink ${styles.plate}`} data-field="dark">
        <img className={styles.plateImg} src="/vidmar/gravure/macbeth-cave.webp" alt="" aria-hidden="true" />
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
                  <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
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

      <ClosingBlock title="Не пропустіть перший запис" />
    </>
  );
}
