import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Seal from "@/components/Seal";
import ScrollProgress from "@/components/ScrollProgress";
import JournalCover from "@/components/JournalCover";
import { Icon } from "@/components/JournalIcons";
import { channels, dateText, entries, entryBySlug, entryPath, FEATURED, inRubric, readTime, rubricOf, rubrics } from "@/lib/journal";
import { seoMeta } from "@/lib/seo";
import { typo } from "@/lib/typo";
import styles from "./journal.module.css";
import { Txt } from "@/components/SiteText";

export const generateMetadata = (): Promise<Metadata> =>
  seoMeta(
    "Журнал – ВІДЬМАР",
    "Журнал видавництва ВІДЬМАР: тексти про Таро, обряд, рід і міф з каналів академії «Всесвіт Луннарії» та Яра Линського.",
    "/journal",
  );

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

export default function JournalPage() {
  const featured = entryBySlug(FEATURED) ?? entries[0];
  const shown = rubrics.filter((r) => inRubric(r.id).length);
  const since = entries.reduce((y, e) => Math.min(y, new Date(e.date).getFullYear()), 9999);
  return (
    <>
      {/* the title page: the journal opens like a book */}
      <ScrollProgress className={`deep ${styles.hero}`} data-field="dark" data-candle="">
        <span className={styles.heroPlate} aria-hidden="true" />
        <div className={styles.heroRing} aria-hidden="true">
          <Seal ticks={84} star />
        </div>
        <div className={`wrapMax ${styles.heroIn}`}>
          <span className={styles.heroKicker}>
            <span aria-hidden="true" />
            Журнал видавництва ВІДЬМАР
            <span aria-hidden="true" />
          </span>
          <ul className={styles.heroMarks} aria-label="Рубрики журналу">
            {shown.map((r) => (
              <li key={r.id} title={r.title}>
                <Icon name={r.id} size={20} />
              </li>
            ))}
          </ul>
          <h1 className={styles.heroTitle}>
            <Txt k="page.journal.title" />
          </h1>
          <span className={styles.heroOrn} aria-hidden="true" />
          <p className={styles.heroLede}>
            <Txt k="page.journal.lede" />
          </p>
          <dl className={styles.heroStats}>
            <div>
              <dt>текстів</dt>
              <dd>{entries.length}</dd>
            </div>
            <div>
              <dt>рубрик</dt>
              <dd>{shown.length}</dd>
            </div>
            <div>
              <dt>перший текст</dt>
              <dd>{since}</dd>
            </div>
          </dl>
          <a href="#contents" className={styles.heroCue} aria-label="До змісту">
            <span aria-hidden="true" />
          </a>
        </div>
      </ScrollProgress>

      {/* the text to begin with */}
      {featured && (
        <section className="ink padS" data-field="dark" data-candle="">
          <div className="wrapMax">
            <Reveal instant>
              <Link href={entryPath(featured.slug)} prefetch={false} className={styles.featured}>
                <JournalCover slug={featured.slug} rubric={featured.rubric} image={featured.image} ratio="3 / 2" priority />
                <span className={styles.featuredBody}>
                  <span className={styles.kicker}>Читайте першим</span>
                  <span className={styles.badge}>
                    <Icon name={featured.rubric} size={16} />
                    {rubricOf(featured).title}
                  </span>
                  <span className={styles.featuredTitle}>{typo(featured.title)}</span>
                  <span className={styles.featuredDek}>{typo(featured.dek)}</span>
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

      {/* the contents: one page of a book, the rubrics as its chapters */}
      <section id="contents" className={`ink ${styles.shelf}`} data-field="dark">
        <div className={styles.contents}>
          <header className={styles.contentsHead}>
            <span className={styles.contentsKicker}>Відьмар · Журнал</span>
            <h2 className={styles.contentsTitle}>Зміст</h2>
            <span className={styles.orn} aria-hidden="true" />
          </header>
          {shown.map((r, k) => {
            const list = inRubric(r.id);
            return (
              <section key={r.id} id={r.id} className={styles.chapter} aria-labelledby={`h-${r.id}`}>
                <header className={styles.chHead}>
                  <span className={styles.numeral} aria-hidden="true">
                    {ROMAN[k]}
                  </span>
                  <div className={styles.chText}>
                    <h3 id={`h-${r.id}`} className={styles.chTitle}>
                      <Icon name={r.id} size={20} />
                      {r.title}
                    </h3>
                    <p className={styles.chLede}>{r.lede}</p>
                  </div>
                </header>
                <ul className={styles.rows}>
                  {list.map((e) => (
                    <li key={e.slug}>
                      <Link href={entryPath(e.slug)} prefetch={false} className={styles.row}>
                        <span className={styles.rowCover}>
                          <JournalCover slug={e.slug} rubric={e.rubric} image={e.image} ratio="3 / 2" />
                        </span>
                        <span className={styles.rowBody}>
                          <span className={styles.rowTitle}>{typo(e.title)}</span>
                          <span className={styles.rowDek}>{typo(e.dek)}</span>
                          <span className={styles.rowMeta}>
                            {dateText(e.date)} · {readTime(e.minutes)}
                          </span>
                        </span>
                        <span className={styles.rowGo} aria-hidden="true">
                          <Icon name="arrow" size={18} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
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
