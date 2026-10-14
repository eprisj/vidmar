import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import ShareRow from "@/components/ShareRow";
import { SITE_URL, pageMeta } from "@/lib/seo";
import { libraryBooks, libraryBySlug, libraryPath, loadBlocks, minutesFor, readTime } from "@/lib/library";
import styles from "./read.module.css";

/* One static page per book of the free library: the whole text, set to be read. */
export const dynamicParams = false;

export function generateStaticParams() {
  return libraryBooks.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = libraryBySlug(slug);
  if (!b) return { title: "Бібліотека – ВІДЬМАР", robots: { index: false } };
  return pageMeta(`${b.title}, ${b.author} – читати онлайн | ВІДЬМАР`, b.dek, libraryPath(b.slug));
}

export default async function LibraryBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = libraryBySlug(slug);
  if (!book) return null;
  const blocks = loadBlocks(book);
  const parts = blocks.flatMap((b) => (b.t === "heading" ? [b] : []));
  const at = libraryBooks.findIndex((x) => x.slug === book.slug);
  const other = libraryBooks[(at + 1) % libraryBooks.length];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: book.author },
    datePublished: String(book.year),
    inLanguage: "uk",
    isAccessibleForFree: true,
    url: `${SITE_URL}${libraryPath(book.slug)}`,
    publisher: { "@id": `${SITE_URL}/#org` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={styles.progress} aria-hidden="true" />
      <PageHero
        label={`${book.author}, ${book.year}`}
        title={book.title}
        lede={`${book.dek} ${readTime(minutesFor(blocks))}.`}
        variant={2}
        compact
      />

      <section className={`ink ${styles.paper}`} data-field="dark">
        <div className={styles.sheet}>
          <p className={styles.runhead} aria-hidden="true">
            <span>Відьмар · Вільна бібліотека</span>
            <span>{book.form}</span>
          </p>

          <p className={styles.about}>{book.about}</p>

          {parts.length > 1 && (
            <nav className={styles.toc} aria-label="Зміст">
              <p className={styles.tocLabel}>Зміст</p>
              <ol>
                {parts.map((p) => (
                  <li key={p.id}>
                    <a href={`#${p.id}`}>{p.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <article className={styles.text} lang="uk">
            {blocks.map((b, i) => {
              switch (b.t) {
                case "heading":
                  return (
                    <h2 key={i} id={b.id} className={styles.part}>
                      {b.text}
                    </h2>
                  );
                case "speaker":
                  return (
                    <p key={i} className={styles.speaker}>
                      {b.text}
                    </p>
                  );
                case "remark":
                  return (
                    <p key={i} className={styles.remark}>
                      {b.text}
                    </p>
                  );
                case "verse":
                  return (
                    <p key={i} className={styles.verse}>
                      {b.lines.map((l, j) => (
                        <span key={j}>{l}</span>
                      ))}
                    </p>
                  );
                default:
                  return (
                    <p key={i} className={b.cap ? styles.cap : undefined}>
                      {b.text}
                    </p>
                  );
              }
            })}
          </article>

          <p className={styles.fleuron} aria-hidden="true" />
          <p className={styles.source}>
            Текст у суспільному надбанні. Джерело: {book.source}. Можна читати без реєстрації й безкоштовно;
            ця сама книга є в застосунку ВІДЬМАР для iPhone.
          </p>

          <ShareRow url={`${SITE_URL}${libraryPath(book.slug)}`} title={`${book.title}, ${book.author}`} />

          {other && (
            <nav className={styles.next} aria-label="Далі в бібліотеці">
              <Link href={libraryPath(other.slug)} prefetch={false}>
                <span className={styles.nextLabel}>Далі читати</span>
                <span className={styles.nextTitle}>{other.title}</span>
                <span className={styles.nextBy}>{other.author}</span>
              </Link>
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
