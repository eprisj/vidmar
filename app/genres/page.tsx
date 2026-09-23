import Link from "next/link";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { genres, showsNote } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import styles from "./genres.module.css";
import { Txt } from "@/components/SiteText";

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

/** Native width of each plate's largest export, for the srcSet descriptor.
 * Restored from the pre-optimisation scans in git history (2x–3x what the
 * site had been serving) and re-cropped/re-duotoned at that size, so the
 * banner and every tile have a real 1600–1800px source instead of the same
 * ~900–1200px file stretched across a retina screen. */
const plateWidth: Record<string, number> = {
  "mystique-forest": 1600,
  "macbeth-cave": 1761,
  bluebeard: 1600,
  "death-moon": 1400,
  "fantasy-giant": 1600,
  "witches-storm": 1707,
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
        compact
        label="Напрями"
        title={<Txt k="page.genres.title" />}
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
          srcSet="/gravure/witches-storm-sm.webp 780w, /gravure/witches-storm-md.webp 1200w, /gravure/witches-storm.webp 1707w"
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
                  srcSet={`/gravure/${tilePlate[g.slug]}-sm.webp 780w, /gravure/${tilePlate[g.slug]}-md.webp 1200w, /gravure/${tilePlate[g.slug]}.webp ${plateWidth[tilePlate[g.slug]]}w`}
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
                  {/* the tiles already lifted and brightened on hover as if
                      they led somewhere, and led nowhere; the title link is
                      stretched over the whole tile and opens the catalogue
                      filtered to this direction */}
                  <Link
                    className={styles.tileLink}
                    href={`/catalog?g=${g.slug}#books`}
                    prefetch={false}
                  >
                    <span className={styles.tileTitle}>{g.title}</span>
                  </Link>
                  <span className={`micro ${styles.tileCue}`} aria-hidden="true">
                    книги напряму →
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* the call to send a manuscript already runs once on the home page
          and in the header/footer nav — repeating it here, full-width,
          right after a page about genres, was the site asking twice on
          two consecutive clicks */}
    </>
  );
}
