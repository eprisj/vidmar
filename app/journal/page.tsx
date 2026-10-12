import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { channels, dateText, entries, entryBySlug, entryPath, FEATURED, inRubric, readTime, rubrics } from "@/lib/journal";
import { seoMeta } from "@/lib/seo";
import styles from "./journal.module.css";
import { Txt } from "@/components/SiteText";

export const generateMetadata = (): Promise<Metadata> =>
  seoMeta(
    "Журнал – ВІДЬМАР",
    "Журнал видавництва ВІДЬМАР: тексти про Таро, обряд, рід і міф з каналів академії «Всесвіт Луннарії» та Яра Линського.",
    "/journal",
  );

export default function JournalPage() {
  const featured = entryBySlug(FEATURED) ?? entries[0];
  return (
    <>
      <PageHero compact label="Журнал" title={<Txt k="page.journal.title" />} lede={<Txt k="page.journal.lede" />} variant={5} />

      {/* the first text of the journal, with its picture */}
      {featured && (
        <section className="ink padS" data-field="dark" data-candle="">
          <div className="wrapMax">
            <Reveal>
              <Link href={entryPath(featured.slug)} prefetch={false} className={styles.featured}>
                {featured.image ? (
                  <img className={styles.featuredImg} src={featured.image} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span className={styles.featuredImg} aria-hidden="true" />
                )}
                <span className={styles.featuredBody}>
                  <span className="micro micro--bright">читати першим</span>
                  <span className={styles.featuredTitle}>{featured.title}</span>
                  <span className={styles.featuredDek}>{featured.dek}</span>
                  <span className={`micro ${styles.meta}`}>
                    {dateText(featured.date)} · {readTime(featured.minutes)}
                  </span>
                </span>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* the table of contents: every rubric with the texts that stand in it */}
      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          <Reveal>
            <span className="micro micro--bright">зміст · {entries.length} текстів</span>
          </Reveal>
          <div className={styles.rubrics}>
            {rubrics.map((r) => {
              const list = inRubric(r.id);
              if (!list.length) return null;
              return (
                <Reveal key={r.id}>
                  <section className={styles.rubric} id={r.id} aria-labelledby={`h-${r.id}`}>
                    <header className={styles.rubricHead}>
                      <h2 id={`h-${r.id}`} className={styles.rubricTitle}>
                        {r.title}
                      </h2>
                      <p className={styles.rubricLede}>{r.lede}</p>
                    </header>
                    <ul className={styles.list}>
                      {list.map((e) => (
                        <li key={e.slug}>
                          <Link href={entryPath(e.slug)} prefetch={false} className={styles.row}>
                            <span className={styles.rowMain}>
                              <span className={styles.rowTitle}>{e.title}</span>
                              <span className={styles.rowDek}>{e.dek}</span>
                            </span>
                            <span className={`micro ${styles.rowMeta}`}>
                              {dateText(e.date)}
                              <br />
                              {readTime(e.minutes)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ink padS" data-field="dark">
        <div className="wrapMax">
          <Reveal>
            <div className={styles.more}>
              <span className="micro micro--bright">далі в Telegram</span>
              <div className={styles.moreList}>
                {channels.map((c) => (
                  <a key={c.handle} className={styles.moreRow} href={`https://t.me/${c.handle}`} target="_blank" rel="noopener noreferrer">
                    <span className={styles.moreName}>{c.name}</span>
                    <span className={styles.moreNote}>{c.note}</span>
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
