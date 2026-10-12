import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import JournalText from "@/components/JournalText";
import JournalCover from "@/components/JournalCover";
import ShareRow from "@/components/ShareRow";
import { Icon } from "@/components/JournalIcons";
import { CARDS_IN, MARKS_IN, PULL, artFor, creditFor, around, dateText, entries, entryBySlug, entryPath, plateFor, readTime, rubricOf } from "@/lib/journal";
import { SITE_URL, getSeoAtBuild, pageMeta } from "@/lib/seo";
import styles from "./entry.module.css";

/* One static page per text of the journal: its own address, title and
   description for search and for the link card. */
export const dynamicParams = false;

export function generateStaticParams() {
  return entries.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = entryBySlug(slug);
  if (!e) return { title: "Журнал – ВІДЬМАР", robots: { index: false } };
  const seo = await getSeoAtBuild();
  const m = pageMeta(`${e.title}${seo.title_suffix}`, e.dek, entryPath(e.slug), e.image, e.title);
  m.openGraph = { ...m.openGraph, type: "article", publishedTime: e.date } as Metadata["openGraph"];
  if (seo.noindex) m.robots = { index: false, follow: false };
  return m;
}

export default async function JournalEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = entryBySlug(slug);
  if (!e) return null;
  const rubric = rubricOf(e);
  const art = artFor(e);
  const plate = plateFor(e);
  const { prev, next } = around(e.slug);
  const more = entries.filter((x) => x.slug !== e.slug && x.rubric !== e.rubric).slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: e.title,
    description: e.dek,
    datePublished: e.date,
    inLanguage: "uk",
    mainEntityOfPage: `${SITE_URL}${entryPath(e.slug)}`,
    ...(e.image ? { image: `${SITE_URL}${e.image}` } : {}),
    publisher: { "@id": `${SITE_URL}/#org` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={styles.progress} aria-hidden="true" />

      {/* the head: dark, plain and quiet, so the text below is the page */}
      <header
        className={`ink ${styles.head} ${art?.card ? styles.headCard : ""}`}
        data-field="dark"
        data-candle=""
        style={{ ["--plate" as string]: `url(/gravure/${plate}-md.webp)` }}
      >
        <span className={styles.headPlate} aria-hidden="true" />
        {art?.card && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.headCardImg} src={`/tarot/${art.card}.webp`} alt="" decoding="async" />
        )}
        <div className={`wrapMax ${styles.headIn}`}>
          <nav className={styles.crumbs} aria-label="Розділ">
            <Link href="/journal" prefetch={false}>
              <Icon name="back" size={15} />
              Журнал
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/journal#${rubric.id}`} prefetch={false} className={styles.crumbRubric}>
              <Icon name={rubric.id} size={16} />
              {rubric.title}
            </Link>
          </nav>
          <h1 className={styles.title}>{e.title}</h1>
          <p className={styles.dek}>{e.dek}</p>
          <p className={`micro ${styles.meta}`}>
            <span className={styles.metaItem}>
              <Icon name="calendar" size={15} />
              <time dateTime={e.date}>{dateText(e.date)}</time>
            </span>
            <span className={styles.metaItem}>
              <Icon name="clock" size={15} />
              {readTime(e.minutes)}
            </span>
          </p>
          <p className={styles.credit}>
            На шапці: {creditFor(plate)}
          </p>
        </div>
      </header>

      {/* the paper: the text itself, on wheat */}
      <section className={`ink ${styles.paper}`} data-field="dark">
        <div className={styles.sheet}>
          {e.image && (
            <figure className={styles.figure}>
              <img src={e.image} alt="" decoding="async" />
            </figure>
          )}
          <p className={styles.runhead} aria-hidden="true">
            <span>Відьмар · Журнал</span>
            <span>
              <Icon name={rubric.id} size={15} />
              {rubric.title}
            </span>
          </p>
          <article>
            <JournalText blocks={e.blocks} pull={PULL[e.slug]} cards={CARDS_IN[e.slug]} marks={MARKS_IN[e.slug]} />
            <p className={styles.fleuron} aria-hidden="true">
              ✦
            </p>
            <p className={styles.source}>
              Текст уперше з’явився в Telegram:{" "}
              <a href={e.url} target="_blank" rel="noopener noreferrer">
                читати й обговорити там
              </a>
            </p>
          </article>

          <ShareRow url={`${SITE_URL}${entryPath(e.slug)}`} title={e.title} />

          {(prev || next) && (
            <nav className={styles.pager} aria-label="У цій рубриці">
              {prev ? (
                <Link href={entryPath(prev.slug)} prefetch={false} className={styles.pagerLink}>
                  <span className={`micro ${styles.pagerLabel}`}>
                    <Icon name="back" size={14} />
                    раніше в рубриці
                  </span>
                  <span className={styles.pagerTitle}>{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={entryPath(next.slug)} prefetch={false} className={`${styles.pagerLink} ${styles.pagerNext}`}>
                  <span className={`micro ${styles.pagerLabel}`}>
                    далі в рубриці
                    <Icon name="arrow" size={14} />
                  </span>
                  <span className={styles.pagerTitle}>{next.title}</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </section>

      {more.length > 0 && (
        <section className="ink-2 padS" data-field="dark">
          <div className="wrapMax">
            <Reveal>
              <span className="micro micro--bright">ще в журналі</span>
            </Reveal>
            <ul className={styles.more}>
              {more.map((x) => (
                <li key={x.slug}>
                  <Link href={entryPath(x.slug)} prefetch={false} className={styles.moreCard}>
                    <JournalCover slug={x.slug} rubric={x.rubric} image={x.image} ratio="16 / 10" />
                    <span className="micro">{rubricOf(x).title}</span>
                    <span className={styles.moreTitle}>{x.title}</span>
                    <span className={styles.moreDek}>{x.dek}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
