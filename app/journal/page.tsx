import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Subscribe from "@/components/Subscribe";
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
        <p className="micro micro--bright">Журнал</p>
        <h1 className={styles.title}>Скоро тут будуть записи</h1>
      </div>

      <div className="wrapMax">
        <Reveal>
          <div className={styles.empty}>
            <p className="body">
              Журнал видавництва запрацює, коли вийде перша книга: тут
              зʼявляться нотатки про підготовку видання, розмови з авторами й
              полиця редакції. Поки що найкращий спосіб не пропустити
              початок — підписка на розсилку.
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
