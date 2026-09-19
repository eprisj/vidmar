import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import CatalogGrid from "@/components/CatalogGrid";
import ClosingBlock from "@/components/ClosingBlock";
import { genres } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  "Каталог — ВІДЬМАР",
  "Каталог видавництва ВІДЬМАР наповниться, щойно вийде перше видання. Фільтри за напрямом уже працюють.",
  "/catalog",
);

export default function CatalogPage() {
  return (
    <>
      <PageHero
        label="Каталог"
        title="Перша книга готується"
        lede="Тут з’являться наші видання — з обкладинками, описами й посиланнями на покупку. Поки полиця порожня, але фільтри за напрямом уже працюють."
        variant={4}
      />

      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          <Reveal>
            <span className="micro micro--bright">каталог</span>
          </Reveal>
          <div style={{ marginTop: "clamp(24px,3vw,40px)" }}>
            <CatalogGrid genres={genres} />
          </div>
        </div>
      </section>

      <ClosingBlock
        title="Дізнайтесь першими, коли з’явиться перша книга"
        text="Без спаму — тільки дата виходу, анонси та новини видавництва."
      />
    </>
  );
}
