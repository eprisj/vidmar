import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CatalogGrid from "@/components/CatalogGrid";
import { genres } from "@/lib/content";
import { getBooksAtBuild } from "@/lib/api";
import { pageMeta } from "@/lib/seo";
import styles from "./catalog.module.css";

export const metadata: Metadata = pageMeta(
  "Каталог – ВІДЬМАР",
  "Книги видавництва ВІДЬМАР: паперові й електронні видання з доставкою Новою поштою.",
  "/catalog",
);

export default async function CatalogPage() {
  // baked in at build; an unreachable API just means the client fetches it
  const initial = await getBooksAtBuild();
  return (
    <>
      <PageHero
        label="Каталог"
        title="Книги ВІДЬМАР"
        variant={4}
        compact
      />

      {/* /genres links here as /catalog?g=<slug>#books */}
      <section id="books" className={`ink pad ${styles.books}`} data-field="dark" data-candle="">
        <div className="wrapMax">
          <CatalogGrid genres={genres} initial={initial.length ? initial : null} />
        </div>
      </section>
    </>
  );
}
