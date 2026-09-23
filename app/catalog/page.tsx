import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CatalogGrid from "@/components/CatalogGrid";
import { genres } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  "Каталог – ВІДЬМАР",
  "Каталог видавництва ВІДЬМАР наповниться, щойно вийде перше видання.",
  "/catalog",
);

export default function CatalogPage() {
  return (
    <>
      <PageHero
        label="Каталог"
        title="Перша книга готується"
        lede="Тут з’являться наші видання – з обкладинками, описами й посиланнями на покупку. Поки полиця чекає: нижче напрями, у яких готуються перші книги."
        variant={4}
        compact
      />

      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          <CatalogGrid genres={genres} />
        </div>
      </section>
    </>
  );
}
