import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import JournalCover from "@/components/JournalCover";
import { Icon } from "@/components/JournalIcons";
import { channels, dateText, entries, entryBySlug, entryPath, FEATURED, inRubric, readTime, rubricOf, rubrics } from "@/lib/journal";
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
  const shown = rubrics.filter((r) => inRubric(r.id).length);
  return (
    <>
      <PageHero compact label="Журнал" title={<Txt k="page.journal.title" />} lede={<Txt k="page.journal.lede" />} variant={5} />

      {/* the text to begin with */}
      {featured && (
        <section className="ink padS" data-field="dark" data-candle="">
          <div className="wrapMax">
            <Reveal instant>
              <Link href={entryPath(featured.slug)} prefetch={false} className={styles.featured}>
                <JournalCover slug={featured.slug} rubric={featured.rubric} image={featured.image} ratio="3 / 2" priority />
                <span className={styles.featuredBody}>
                  <span className={styles.badge}>
                    <Icon name={featured.rubric} size={16} />
                    {rubricOf(featured).title}
                  </span>
                  <span className={styles.featuredTitle}>{featured.title}</span>
                  <span className={styles.featuredDek}>{featured.dek}</span>
                  <span className={styles.featuredMeta}>
                    <span>
                      <Icon name="calendar" size={16} />
                      {dateText(featured.date)}
                    </span>
                    <span>
                      <Icon name="clock" size={16} />
                      {readTime(featured.minutes)}
                    </span>
                  </span>
                  <span className={styles.go}>
                    Читати
                    <Icon name="arrow" size={18} />
                  </span>
                </span>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* the rubrics, to jump between */}
      <nav className={styles.tabs} aria-label="Рубрики" data-field="dark">
        <div className={`wrapMax ${styles.tabsIn}`}>
          {shown.map((r) => (
            <a key={r.id} href={`#${r.id}`} className={styles.tab}>
              <Icon name={r.id} size={18} />
              <span>{r.title}</span>
              <b>{inRubric(r.id).length}</b>
            </a>
          ))}
        </div>
      </nav>

      {shown.map((r, k) => {
        const list = inRubric(r.id);
        return (
          <section key={r.id} id={r.id} className={`${k % 2 ? "ink-2" : "ink"} ${styles.rubric}`} data-field="dark" aria-labelledby={`h-${r.id}`}>
            <div className="wrapMax">
              <Reveal>
                <header className={styles.rubricHead}>
                  <span className={styles.rubricIcon}>
                    <Icon name={r.id} size={26} />
                  </span>
                  <div>
                    <h2 id={`h-${r.id}`} className={styles.rubricTitle}>
                      {r.title}
                    </h2>
                    <p className={styles.rubricLede}>{r.lede}</p>
                  </div>
                  <span className={`micro ${styles.rubricCount}`}>{list.length} текстів</span>
                </header>
              </Reveal>
              <ul className={styles.grid}>
                {list.map((e, i) => (
                  <li key={e.slug}>
                    <Reveal delay={(i % 3) * 80}>
                      <Link href={entryPath(e.slug)} prefetch={false} className={styles.card}>
                        <JournalCover slug={e.slug} rubric={e.rubric} image={e.image} />
                        <span className={styles.cardBody}>
                          <span className={styles.cardTitle}>{e.title}</span>
                          <span className={styles.cardDek}>{e.dek}</span>
                          <span className={styles.cardMeta}>
                            <span>{dateText(e.date)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{readTime(e.minutes)}</span>
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
      })}

      <section className="ink padS" data-field="dark">
        <div className="wrapMax">
          <Reveal>
            <div className={styles.more}>
              <span className="micro micro--bright">далі в Telegram</span>
              <div className={styles.moreList}>
                {channels.map((c) => (
                  <a key={c.handle} className={styles.moreRow} href={`https://t.me/${c.handle}`} target="_blank" rel="noopener noreferrer">
                    <span className={styles.moreIcon}>
                      <Icon name="telegram" size={22} />
                    </span>
                    <span className={styles.moreText}>
                      <span className={styles.moreName}>{c.name}</span>
                      <span className={styles.moreNote}>{c.note}</span>
                    </span>
                    <Icon name="arrow" size={20} />
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
