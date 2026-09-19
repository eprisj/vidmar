import Link from "next/link";
import Hero from "@/components/Hero";
import Atmosphere from "@/components/Atmosphere";
import Smoke from "@/components/Smoke";
import Seal from "@/components/Seal";
import Reveal from "@/components/Reveal";
import SubmitBlock from "@/components/SubmitBlock";
import ClosingBlock from "@/components/ClosingBlock";
import ScrollProgress from "@/components/ScrollProgress";
import Marquee from "@/components/Marquee";
import LitText from "@/components/LitText";
import GenreRows from "@/components/GenreRows";
import { founderLetter, genres, positioning, status } from "@/lib/content";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <Hero />

      {/* the dark scene: stone, living smoke, the ring turning with the scroll */}
      <ScrollProgress className={styles.scene} data-field="dark" data-candle="">
        <Atmosphere />
        <Smoke intensity={0.9} source={[0.5, 0.05]} />
        <div className={styles.sceneIn}>
          <div className={styles.sceneRing}>
            <Seal star={false} />
          </div>
          <div className={styles.sceneCopy}>
            <span className={styles.sceneStar}>
              <Seal ticks={0} emblem />
            </span>
            <p className={styles.sceneText}>{positioning}</p>
          </div>
        </div>
      </ScrollProgress>

      {/* the directions, drifting past */}
      <section className="ink" data-field="dark">
        <Marquee words={genres.map((g) => g.title)} />
      </section>

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

      {/* the founder's letter, lit word by word */}
      <section className={`ink-2 pad ${styles.letterScene}`} data-field="dark" data-candle="">
        <Smoke intensity={0.55} source={[0.85, 0.0]} tint={[0.62, 0.5, 0.3]} />
        <div className={`wrapMax ${styles.letterIn}`}>
          <Reveal>
            <div className={styles.head} style={{ marginBottom: "clamp(30px,4vw,54px)" }}>
              <span className="micro micro--bright">лист засновника</span>
            </div>
          </Reveal>

          <LitText text={founderLetter[2]} className={styles.letterLit} />

          <div className={styles.letterFoot}>
            <p className="body">{founderLetter[3]}</p>
            <Link className="pill pill--bare" href="/about">
              Читати лист повністю
            </Link>
          </div>
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
            {status.map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className={styles.statusRow}>
                  <span className={styles.bigNum}>{s.n}</span>
                  <span className={styles.statusTitle}>{s.title}</span>
                  <p className="body">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SubmitBlock />

      <ClosingBlock />
    </>
  );
}
