import Link from "next/link";
import Hero from "@/components/Hero";
import Atmosphere from "@/components/Atmosphere";
import Seal from "@/components/Seal";
import Reveal from "@/components/Reveal";
import Subscribe from "@/components/Subscribe";
import {
  EMAIL,
  founderLetter,
  genres,
  positioning,
  status,
  submissionRules,
} from "@/lib/content";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <Hero />

      {/* the dark scene: stone, a seam of light, the seal */}
      <section className={styles.scene} data-field="dark">
        <Atmosphere />
        <div className={styles.sceneIn}>
          <Seal star={false} />
          <div className={styles.sceneCopy}>
            <span className={styles.sceneStar}>
              <Seal ticks={0} emblem />
            </span>
            <p className={styles.sceneText}>{positioning}</p>
            <p className={`micro ${styles.sceneCaption}`}>
              езотерика · містика · відьомство · духовні практики
            </p>
          </div>
        </div>
      </section>

      {/* what we publish */}
      <section className="ink pad" data-field="dark">
        <div className="wrapMax">
          <Reveal>
            <div className={styles.head}>
              <span className="micro micro--bright">що ми видаємо</span>
              <Link className="link" href="/genres">
                Усі напрями
              </Link>
            </div>
          </Reveal>

          <div className={styles.genres} style={{ marginTop: "clamp(28px,4vw,56px)" }}>
            {genres.map((g, i) => (
              <Reveal key={g.slug} delay={i * 40}>
                <div className={styles.genreRow}>
                  <span className={styles.index}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.genreTitle}>{g.title}</span>
                  {g.note && <span className="micro">{g.note}</span>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* the founder's letter */}
      <section className="ink-2 pad" data-field="dark">
        <div className="wrapMax">
          <Reveal>
            <div className={styles.head} style={{ marginBottom: "clamp(30px,4vw,54px)" }}>
              <span className="micro micro--bright">лист засновника</span>
            </div>
          </Reveal>

          <div className={styles.letter}>
            <Reveal>
              <p className={styles.letterQuote}>{founderLetter[2]}</p>
            </Reveal>
            <Reveal delay={120}>
              <div>
                <p className="body">{founderLetter[3]}</p>
                <div className={styles.cta}>
                  <Link className="pill pill--bare" href="/about">
                    Читати лист повністю
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* where we are right now */}
      <section className="ink pad" data-field="dark">
        <div className="wrapMax">
          <Reveal>
            <div className={styles.head} style={{ marginBottom: "clamp(20px,3vw,36px)" }}>
              <span className="micro micro--bright">зараз</span>
            </div>
          </Reveal>

          <div className={styles.status}>
            {status.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className={styles.statusRow}>
                  <span className={styles.index}>{s.n}</span>
                  <span className={styles.statusTitle}>{s.title}</span>
                  <p className="body">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* submissions */}
      <section className="ash pad" data-field="light">
        <div className="wrapMax">
          <Reveal>
            <div className={styles.head}>
              <span className="micro micro--bright">для авторів</span>
            </div>
          </Reveal>

          <div className={styles.submission} style={{ marginTop: "clamp(28px,4vw,50px)" }}>
            <Reveal>
              <div>
                <h2 className="statement">У вас є готовий рукопис?</h2>
                <p className="body" style={{ marginTop: 20 }}>
                  На першому етапі ми розглядаємо максимально готові до друку
                  тексти. Надсилайте рукопис та інформацію про себе — будемо
                  знайомитися.
                </p>
                <div className={styles.cta}>
                  <a className="pill pill--solid" href={`mailto:${EMAIL}`}>
                    {EMAIL}
                  </a>
                  <Link className="pill pill--bare" href="/submissions">
                    Умови прийому
                  </Link>
                </div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className={styles.rules}>
                {submissionRules.map((r, i) => (
                  <div key={r} className={styles.rule}>
                    <span className="micro">{String(i + 1).padStart(2, "0")}</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* closing — newsletter */}
      <section className="ink pad" data-field="dark">
        <div className={`wrapMax ${styles.closing}`}>
          <Reveal>
            <span className="micro">розсилка</span>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="statement">Дізнайтесь першими про вихід книги</h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="body" style={{ textAlign: "center" }}>
              Без спаму — тільки дата виходу, анонси та новини видавництва.
            </p>
          </Reveal>
          <Reveal delay={230}>
            <Subscribe />
          </Reveal>
        </div>
      </section>
    </>
  );
}
