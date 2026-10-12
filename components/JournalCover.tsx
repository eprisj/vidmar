import { Icon } from "./JournalIcons";
import { artFor, type Entry } from "@/lib/journal";
import styles from "./JournalCover.module.css";

/** the same text always gets the same stars */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** each rubric's own colour of night: the same blue, tipped warm, green or violet */
const NIGHT: Record<string, [string, string]> = {
  taro: ["#2d4f8e", "#1d3a6d"],
  obriad: ["#7a5a3d", "#2c3358"],
  mif: ["#2f6671", "#1b3a5a"],
  dumky: ["#51457f", "#202f66"],
  polytsia: ["#355b8a", "#1a335f"],
};

/** The picture of a text: its own illustration when the post had one,
 * otherwise a plate drawn here: night blue, rings round a centre that moves
 * from text to text, a few stars and the rubric's mark in gold. */
export default function JournalCover({
  slug,
  rubric,
  image,
  ratio = "4 / 3",
  priority = false,
  size = "xs",
}: {
  slug: string;
  rubric: string;
  image: string | null;
  ratio?: string;
  priority?: boolean;
  /** which size of the plate to load: small cards take xs, the large cover sm */
  size?: "xs" | "sm";
}) {
  const art = image ? null : artFor({ slug } as Entry);
  if (art) {
    return (
      <span className={`${styles.cover} ${art.card ? styles.hasCard : ""}`} style={{ aspectRatio: ratio }} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={`${styles.img} ${styles.plateImg}`} src={`/gravure/${art.plate}-${size}.webp`} alt="" loading={priority ? "eager" : "lazy"} decoding="async" />
        <span className={styles.shade} />
        {art.card ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.card} src={`/tarot/${art.card}.webp`} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className={styles.seal}>
            <Icon name={rubric} size={30} />
          </span>
        )}
      </span>
    );
  }
  if (image) {
    return (
      <span className={styles.cover} style={{ aspectRatio: ratio }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.img} src={image} alt="" loading={priority ? "eager" : "lazy"} decoding="async" />
      </span>
    );
  }
  const r = rng(slug);
  const [lit, mid] = NIGHT[rubric] ?? NIGHT.taro;
  const cx = 150 + r() * 100;
  const cy = 90 + r() * 120;
  const rings = [46, 82, 124, 172, 226].map((rad, i) => ({ rad: rad + r() * 8, o: 0.22 - i * 0.035 }));
  const stars = Array.from({ length: 26 }, () => ({ x: r() * 400, y: r() * 300, s: 0.6 + r() * 1.3, o: 0.25 + r() * 0.55 }));
  return (
    <span className={styles.cover} style={{ aspectRatio: ratio }} aria-hidden="true">
      <svg className={styles.plate} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`g-${slug}`} cx={cx / 400} cy={cy / 300} r="0.85">
            <stop offset="0" stopColor={lit} />
            <stop offset="0.55" stopColor={mid} />
            <stop offset="1" stopColor="#0e1d3a" />
          </radialGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#g-${slug})`} />
        {rings.map((q, i) => (
          <circle key={i} cx={cx} cy={cy} r={q.rad} fill="none" stroke="#f5deb3" strokeOpacity={q.o} strokeWidth="0.8" strokeDasharray={i % 2 ? "2 5" : undefined} />
        ))}
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#f5deb3" fillOpacity={s.o} />
        ))}
      </svg>
      <span className={styles.mark} style={{ left: `${(cx / 400) * 100}%`, top: `${(cy / 300) * 100}%` }}>
        <Icon name={rubric} size={44} />
      </span>
    </span>
  );
}
