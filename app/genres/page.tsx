import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import SubmitBlock from "@/components/SubmitBlock";
import { genres, showsNote } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import styles from "./genres.module.css";

/** One real 19th-century plate per direction instead of the same
 * generated stone-and-tint texture recoloured six times — each picked for
 * what the genre actually is, not just tinted differently. All public
 * domain (Doré, d. 1883); duotone-mapped to the site's ink/paper values. */
const tilePlate: Record<string, string> = {
  ezoteryka: "mystique-forest",
  vidmovstvo: "macbeth-cave",
  tryler: "bluebeard",
  psyhroman: "death-moon",
  fentezi: "fantasy-giant",
  "mistyka-proza": "witches-storm",
};

/** Natural widths, needed for the srcSet descriptor: the plates are scans of
 * different sizes, and three were cropped in from their paper margins. */
const plateWidth: Record<string, number> = {
  "mystique-forest": 900,
  "macbeth-cave": 1174,
  bluebeard: 900,
  "death-moon": 1200,
  "fantasy-giant": 900,
  "witches-storm": 1138,
};

export const metadata = pageMeta(
  "Напрями – ВІДЬМАР",
  "Що видає ВІДЬМАР: езотерика, містика, відьомство й духовні практики, трилери, психологічні романи, фентезі та містична проза.",
  "/genres",
);

export default function GenresPage() {
  return (
    <>
      <PageHero
        label="Напрями"
        title="Що ми видаємо"
        lede="Книги, яким часом затісно у звичних рамках великого видавничого ринку."
        variant={2}
      />

      {/* a real 1860s Doré engraving instead of another stone-and-tint
          panel — the mosaic below is about the six directions; this is
          about the one word "відьомство" actually meant before it became
          six neat labels */}
      <section className={`ink ${styles.plate}`} data-field="dark">
        <img
          className={styles.plateImg}
          src="/gravure/witches-storm.webp"
          srcSet="/gravure/witches-storm-sm.webp 780w, /gravure/witches-storm.webp 1138w"
          sizes="100vw"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      </section>

      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          {/* one mosaic of stone tiles, each in its own genre's colour — the
              two primary directions simply cut larger than the rest */}
          <div className={styles.mosaic}>
            {genres.map((g, i) => (
              <Reveal
                key={g.slug}
                id={g.slug}
                delay={i * 70}
                className={`${styles.tile} ${g.primary ? styles.tilePrimary : styles.tileSecondary}`}
                style={{ "--tint": g.tint } as React.CSSProperties}
              >
                <img
                  className={styles.tilePlate}
                  src={`/gravure/${tilePlate[g.slug]}.webp`}
                  srcSet={`/gravure/${tilePlate[g.slug]}-sm.webp 780w, /gravure/${tilePlate[g.slug]}.webp ${plateWidth[tilePlate[g.slug]]}w`}
                  sizes="(max-width: 760px) 100vw, 50vw"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                />
                <span className={styles.tileScrim} />
                <span className={styles.accent} />
                <div className={styles.tileIn}>
                  {showsNote(genres, i) && <span className="micro">{g.note}</span>}
                  <span className={styles.tileTitle}>{g.title}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SubmitBlock
        title="Впізнали свій текст серед цих напрямів?"
        text="Надсилайте його та кілька слів про себе – будемо знайомитися."
      />
    </>
  );
}
