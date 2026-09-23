import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import Smoke from "@/components/Smoke";
import Seal from "@/components/Seal";
import Atmosphere from "@/components/Atmosphere";
import { pageMeta } from "@/lib/seo";
import styles from "./about.module.css";
import { LitTxt, Txt } from "@/components/SiteText";

export const metadata: Metadata = pageMeta(
  "Про нас – ВІДЬМАР",
  "ВІДЬМАР – бутикове видавництво книг про езотерику, містику й відьомство. Лист засновника: хто ми, чому починаємо і що робимо.",
  "/about",
);

/** Where the page goes next. There was a second door here, to
 * /submissions — but that repeated, at nearly full screen height, an
 * invitation the header nav, the footer and the home page all already
 * carry. One destination, not the loudest possible copy of the sitemap. */
const doors = [
  { href: "/genres", label: "що ми видаємо", title: "Напрями видавництва", variant: 2 },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        label="Про нас"
        title={<Txt k="page.about.title" />}
        lede={<Txt k="page.about.lede" />}
        variant={1}
      />

      {/* the letter: one text, four different weights, so it reads as a
          composed page rather than four identical paragraphs in a column */}
      <section className={`ink pad ${styles.letterScene}`} data-field="dark" data-candle="">
        <Smoke intensity={0.5} source={[0.12, 0.0]} tint={[0.62, 0.5, 0.3]} />
        <div className={`wrapMax ${styles.letterIn}`}>
          <Reveal>
            <span className="micro micro--bright">лист засновника</span>
          </Reveal>

          <div className={styles.letter}>
            <div className={styles.p0}>
              <LitTxt k="letter.thanks" className={styles.lit0} />
            </div>

            <div className={styles.p1}>
              <LitTxt k="letter.family" className={styles.lit1} />
            </div>

            <div className={styles.p2}>
              <span className={styles.dreamStar} aria-hidden="true">
                <Seal ticks={0} emblem />
              </span>
              <LitTxt k="letter.dream" className={styles.lit2} />
            </div>

            <div className={styles.p3}>
              <LitTxt k="letter.together" className={styles.lit3} />
            </div>
          </div>

          {/* two of them: the signature is the second thing the page says about us */}
          <Reveal>
            <div className={styles.duo}>
              <div className={styles.person}>
                <span className={styles.personStar} aria-hidden="true">
                  <Seal ticks={0} emblem />
                </span>
                <div>
                  <b>Засновник</b>
                  <span>видавництва ВІДЬМАР</span>
                </div>
              </div>
              <span className={styles.duoLine} aria-hidden="true" />
              <div className={styles.person}>
                <span className={styles.personStar} aria-hidden="true">
                  <Seal ticks={0} emblem />
                </span>
                <div>
                  <b>Марія</b>
                  <span>партнерка</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className={styles.doors} data-field="dark">
        {doors.map((d, i) => (
          <Link key={d.href} href={d.href} className={styles.door} data-candle="">
            <Atmosphere variant={d.variant} watermark={false} />
            <span className={styles.doorRing} aria-hidden="true">
              <Seal star={false} ticks={70} />
            </span>
            <span className={styles.doorIn}>
              <span className="micro micro--bright">{d.label}</span>
              <span className={styles.doorTitle}>{d.title}</span>
              <span className={styles.doorArrow} aria-hidden="true">
                →
              </span>
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}
