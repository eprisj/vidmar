import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import CatalogGrid from "@/components/CatalogGrid";
import ClosingBlock from "@/components/ClosingBlock";
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
        lede="Тут з’являться наші видання – з обкладинками, описами й посиланнями на покупку. Поки полиця порожня: нижче напрями, у яких готуються перші книги."
        variant={4}
      />

      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          {/* The page label directly above already reads "Каталог"; a second
              one here only repeated it. */}
          <Reveal>
            <span className="micro micro--bright">напрями видавництва</span>
          </Reveal>
          <div style={{ marginTop: "clamp(24px,3vw,40px)" }}>
            <CatalogGrid genres={genres} />
          </div>
        </div>
      </section>

      <ClosingBlock
        title="Дізнайтесь першими, коли з’явиться перша книга"
        text="Без спаму – тільки дата виходу, анонси та новини видавництва."
      />
    </>
  );
}
