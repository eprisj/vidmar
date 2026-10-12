import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import Runs from "@/components/Runs";
import { around, dateText, entries, entryBySlug, entryPath, readTime, rubricOf } from "@/lib/journal";
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
      <PageHero compact label={rubric.title} title={e.title} lede={e.dek} variant={5} />

      <section className={`ink ${styles.root}`} data-field="dark">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="wrapMax">
          <div className={styles.layout}>
            <aside className={styles.aside}>
              <Link href="/journal" prefetch={false} className="link">
                ← Журнал
              </Link>
              <dl className={styles.facts}>
                <div>
                  <dt className="micro">рубрика</dt>
                  <dd>
                    <Link href={`/journal#${rubric.id}`} prefetch={false}>
                      {rubric.title}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="micro">опубліковано</dt>
                  <dd>
                    <time dateTime={e.date}>{dateText(e.date)}</time>
                  </dd>
                </div>
                <div>
                  <dt className="micro">читати</dt>
                  <dd>{readTime(e.minutes)}</dd>
                </div>
              </dl>
            </aside>

            <article className={styles.article}>
              {e.image && (
                <figure className={styles.figure}>
                  <img src={e.image} alt="" decoding="async" />
                </figure>
              )}
              <div className={styles.text}>
                {e.blocks.map((b, i) => (
                  <p key={i}>
                    {b.map((line, k) => (
                      <span key={k} className={styles.line}>
                        <Runs line={line} />
                      </span>
                    ))}
                  </p>
                ))}
              </div>
              <p className={styles.source}>
                Текст уперше з’явився в Telegram:{" "}
                <a href={e.url} target="_blank" rel="noopener noreferrer">
                  читати й обговорити там
                </a>
                .
              </p>
            </article>
          </div>

          {(prev || next) && (
            <nav className={styles.pager} aria-label="У цій рубриці">
              {prev ? (
                <Link href={entryPath(prev.slug)} prefetch={false} className={styles.pagerLink}>
                  <span className="micro">раніше в рубриці</span>
                  <span className={styles.pagerTitle}>{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={entryPath(next.slug)} prefetch={false} className={`${styles.pagerLink} ${styles.pagerNext}`}>
                  <span className="micro">далі в рубриці</span>
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
