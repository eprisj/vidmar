import Link from "next/link";
import Reveal from "./Reveal";
import JournalCover from "./JournalCover";
import { Icon } from "./JournalIcons";
import { dateText, entryPath, homeEntries, readTime, rubricOf } from "@/lib/journal";
import styles from "./JournalTeasers.module.css";

/** The home page's door into the journal: three texts from three rubrics. */
export default function JournalTeasers() {
  const list = homeEntries();
  if (!list.length) return null;
  return (
    <section className="ink padS" data-field="dark" data-candle="">
      <div className="wrapMax">
        <Reveal>
          <div className={styles.head}>
            <div className={styles.titles}>
              <span className="micro micro--bright">з журналу</span>
              <h2 className={styles.title}>Тексти, до яких повертаються</h2>
            </div>
            <Link className={styles.all} href="/journal" prefetch={false}>
              Усі тексти
              <Icon name="arrow" size={18} />
            </Link>
          </div>
        </Reveal>
        <ul className={styles.grid}>
          {list.map((e, i) => (
            <li key={e.slug}>
              <Reveal delay={i * 90}>
                <Link href={entryPath(e.slug)} prefetch={false} className={styles.card}>
                  <JournalCover slug={e.slug} rubric={e.rubric} image={e.image} ratio="4 / 3" />
                  <span className={styles.body}>
                    <span className={styles.badge}>
                      <Icon name={e.rubric} size={15} />
                      {rubricOf(e).title}
                    </span>
                    <span className={styles.cardTitle}>{e.title}</span>
                    <span className={styles.dek}>{e.dek}</span>
                    <span className={styles.meta}>
                      {dateText(e.date)} · {readTime(e.minutes)}
                    </span>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
