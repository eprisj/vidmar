import Atmosphere from "@/components/Atmosphere";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import SubmitBlock from "@/components/SubmitBlock";
import { genres } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import styles from "./genres.module.css";

export const metadata = pageMeta(
  "Напрями — ВІДЬМАР",
  "Що видає ВІДЬМАР: езотерика, містика, відьомство й духовні практики, трилери, психологічні романи, фентезі та містична проза.",
  "/genres",
);

export default function GenresPage() {
  return (
    <>
      <PageHero
        label="Напрями"
        title="Що ми видаємо"
        lede="Основний напрям — езотерика, містика, відьомство та духовні практики. Також нам цікаві сильні, нестандартні тексти, яким часом затісно у звичних рамках великого видавничого ринку."
        variant={2}
      />

      {/* a real 1860s Doré engraving instead of another stone-and-tint
          panel — the mosaic below is about the six directions; this is
          about the one word "відьомство" actually meant before it became
          six neat labels */}
      <section className={`ink ${styles.plate}`} data-field="dark">
        <img className={styles.plateImg} src="/vidmar/gravure/witches-storm.webp" alt="" aria-hidden="true" />
      </section>

      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          {/* one mosaic of stone tiles, each in its own genre's colour — the
              two primary directions simply cut larger than the rest */}
          <div className={styles.mosaic}>
            {genres.map((g, i) => (
              <Reveal
                key={g.slug}
                delay={i * 70}
                className={`${styles.tile} ${g.primary ? styles.tilePrimary : styles.tileSecondary}`}
                style={{ "--tint": g.tint } as React.CSSProperties}
              >
                <Atmosphere tint={g.tint} variant={i} />
                <span className={styles.accent} />
                <span className={styles.tileIndex}>{String(i + 1).padStart(2, "0")}</span>
                <div className={styles.tileIn}>
                  {g.note && <span className="micro">{g.note}</span>}
                  <span className={styles.tileTitle}>{g.title}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SubmitBlock
        title="Впізнали свій текст серед цих напрямів?"
        text="Надсилайте рукопис та кілька слів про себе. На першому етапі ми розглядаємо максимально готові до друку тексти."
      />
    </>
  );
}
