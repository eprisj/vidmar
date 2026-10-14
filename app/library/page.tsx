import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { seoMeta } from "@/lib/seo";
import { libraryBooks, libraryPath, loadBlocks, minutesFor, readTime } from "@/lib/library";
import styles from "./library.module.css";

export const generateMetadata = (): Promise<Metadata> =>
  seoMeta(
    "Вільна бібліотека – ВІДЬМАР",
    "Українська класика про фольклор і міфічні істоти, яку можна читати безкоштовно: «Лісова пісня» Лесі Українки, «Тіні забутих предків» Михайла Коцюбинського, народні казки й «Лис Микита» Івана Франка.",
    "/library",
  );

export default function LibraryPage() {
  return (
    <>
      <PageHero
        label="Бібліотека"
        title="Вільна бібліотека"
        lede="Українська класика про фольклор і міфічних істот. Читайте тут безкоштовно або в застосунку для iPhone."
        variant={3}
        compact
      />
      <section className={`ink pad ${styles.root}`} data-field="dark" data-candle="">
        <div className="wrapMax">
          <ul className={styles.list}>
            {libraryBooks.map((b) => (
              <li key={b.slug}>
                <Link href={libraryPath(b.slug)} prefetch={false} className={styles.card}>
                  <span className={styles.form}>
                    {b.form}, {b.year}
                  </span>
                  <span className={styles.title}>{b.title}</span>
                  <span className={styles.by}>{b.author}</span>
                  <span className={styles.dek}>{b.dek}</span>
                  <span className={styles.meta}>{readTime(minutesFor(loadBlocks(b)))} · безкоштовно</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            Це книги в суспільному надбанні. Власні видання ВІДЬМАРУ з’являться в <Link href="/catalog">каталозі</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
