import Link from "next/link";
import Hero from "@/components/Hero";
import Atmosphere from "@/components/Atmosphere";
import Smoke from "@/components/Smoke";
import Seal from "@/components/Seal";
import Reveal from "@/components/Reveal";
import SubmitBlock from "@/components/SubmitBlock";
import ScrollProgress from "@/components/ScrollProgress";
import GenreRows from "@/components/GenreRows";
import Shelf from "@/components/Shelf";
import Altar from "@/components/Altar";
import CardOfTheDay from "@/components/CardOfTheDay";
import { genres } from "@/lib/content";
import styles from "./page.module.css";
import { LitTxt, Txt } from "@/components/SiteText";
import StatusRows from "@/components/StatusRows";

export default function Home() {
  return (
    <>
      <Hero />

      {/* the dark scene: a real 1883 Doré engraving instead of the
          generated stone-and-smoke every other dark section on the site
          already uses — this is the one place that gets to be a picture */}
      <ScrollProgress className={`deep ${styles.scene}`} data-field="dark" data-candle="">
        <div className={styles.sceneIn}>
          <div className={styles.sceneRing}>
            <Seal star={false} />
          </div>
          <div className={styles.sceneCopy}>
            <span className={styles.sceneStar}>
              <Seal ticks={0} emblem />
            </span>
            <p className={styles.sceneText}>
              <Txt k="home.positioning" />
            </p>
          </div>
        </div>
      </ScrollProgress>

      {/* what we publish */}
      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          <Reveal>
            <div className={styles.head}>
              <span className="micro micro--bright">що ми видаємо</span>
              <Link className="link" href="/genres">
                Усі напрями
              </Link>
            </div>
          </Reveal>
          <div style={{ marginTop: "clamp(28px,4vw,56px)" }}>
            <GenreRows genres={genres} />
          </div>
        </div>
      </section>

      <Shelf />

      {/* the founder's letter, lit word by word */}
      <section className={`ink-2 pad ${styles.letterScene}`} data-field="dark" data-candle="">
        <Smoke intensity={0.55} source={[0.85, 0.0]} tint={[0.62, 0.5, 0.3]} />
        <div className={`wrapMax ${styles.letterIn}`}>
          <Reveal>
            <div className={styles.head} style={{ marginBottom: "clamp(30px,4vw,54px)" }}>
              <span className="micro micro--bright">лист засновника</span>
            </div>
          </Reveal>

          <LitTxt k="letter.dream" className={styles.letterLit} />

          <div className={styles.letterFoot}>
            <p className="body">
              <Txt k="letter.together" />
            </p>
            <Link className="pill pill--bare" href="/about">
              Читати лист повністю
            </Link>
          </div>
        </div>
      </section>

      <Altar />

      {/* the one interactive thing on the page — the altar just showed a
          reading laid out; this lets the visitor actually draw */}
      <section className={`ink-2 pad ${styles.cardScene}`} data-field="dark" data-candle="">
        <Atmosphere variant={5} watermark={false} />
        <div className={`wrapMax ${styles.cardIn}`}>
          <Reveal>
            <CardOfTheDay />
          </Reveal>
        </div>
      </section>

      {/* where we are right now */}
      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          <Reveal>
            <div className={styles.head} style={{ marginBottom: "clamp(20px,3vw,36px)" }}>
              <span className="micro micro--bright">зараз</span>
            </div>
          </Reveal>

          <div className={styles.status}>
            <StatusRows row={styles.statusRow} title={styles.statusTitle} />
          </div>
        </div>
      </section>

      <SubmitBlock />
    </>
  );
}
