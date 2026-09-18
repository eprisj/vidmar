import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Seal from "@/components/Seal";
import Subscribe from "@/components/Subscribe";
import { journalRubrics } from "@/lib/content";
import styles from "./journal.module.css";

export const metadata: Metadata = {
  title: "Журнал — ВІДЬМАР",
  description:
    "Журнал видавництва ВІДЬМАР — записи про підготовку першої книги зʼявляться тут ближче до випуску.",
};

export default function JournalPage() {
  return (
    <section className="ink" data-field="dark">
      <div className={`wrapMax ${styles.head}`}>
        <span className={styles.headMark}>
          <Seal />
        </span>
        <p className="micro micro--bright">Журнал</p>
        <h1 className={styles.title}>Скоро тут будуть записи</h1>
        <p className={`body ${styles.lede}`}>
          Журнал видавництва запрацює, коли вийде перша книга. Ось із чого
          він почнеться.
        </p>
      </div>

      {/* the three sections, shown as what they are: ruled, numbered and
          empty — a table of contents waiting to be filled in */}
      <div className="wrapMax">
        <div className={styles.rubrics}>
          {journalRubrics.map((title, i) => (
            <Reveal key={title} delay={i * 80} className={styles.rubric}>
              <span className={styles.rubricIndex}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={styles.rubricTitle}>{title}</span>
              <span className={`micro ${styles.rubricState}`}>Готується</span>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className={styles.empty}>
            <p className="body">
              Найкращий спосіб не пропустити початок — підписка на розсилку.
            </p>
            <div className={styles.subscribeWrap}>
              <Subscribe />
            </div>
            <Link className="link" href="/about">
              Про видавництво →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
