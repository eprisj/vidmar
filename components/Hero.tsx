import Link from "next/link";
import back from "@/assets/forest/back.svg";
import mid from "@/assets/forest/mid.svg";
import front from "@/assets/forest/front.svg";
import styles from "./Hero.module.css";

/** Seeded so the server and every visit draw the same swarm. */
function fireflies(count: number) {
  let s = 1117;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    style: {
      left: `${6 + rnd() * 88}%`,
      top: `${46 + rnd() * 46}%`,
      "--dur": `${7 + rnd() * 9}s`,
      "--delay": `${-rnd() * 16}s`,
      "--dx": `${(rnd() - 0.5) * 90}px`,
      "--dy": `${-20 - rnd() * 70}px`,
      "--size": `${2 + rnd() * 2.2}px`,
    } as React.CSSProperties,
  }));
}

const SWARM = fireflies(22);

export default function Hero() {
  return (
    <section className={`deep ${styles.root}`} data-field="dark">
      {/* the night forest as an etching: three generated planes
          (scripts/forest.mjs); the ruled sky, its mist and the moon are baked
          into the far plane */}
      <div className={styles.scene} aria-hidden="true">
        <img
          className={`${styles.plane} ${styles.back}`}
          src={back.src}
          alt=""
          fetchPriority="high"
        />
        <img className={`${styles.plane} ${styles.mid}`} src={mid.src} alt="" />
        <img className={`${styles.plane} ${styles.front}`} src={front.src} alt="" />
      </div>

      <div className={`wrapMax ${styles.title}`}>
        {/* The name is already the wordmark in the header, a few centimetres
            above; set again here in Golos it read as a second, different
            logo. It stays in the markup as the page's h1 for search and
            screen readers, and the hand carries the screen instead. The line
            break is set by hand: left to wrap, "й" was stranded alone. */}
        <h1 className={styles.word}>Відьмар</h1>
        <p className={styles.lede}>
          видаємо книги про езотерику,
          <br />
          містику й відьомство.
        </p>
      </div>

      {/* the fireflies drift in front of everything */}
      <div className={styles.near} aria-hidden="true">
        {SWARM.map((f) => (
          <span key={f.key} className={styles.firefly} style={f.style} />
        ))}
      </div>

      <div className={`wrapMax ${styles.foot}`}>
        <p className="micro">Перше видання – у підготовці</p>
        <span className={styles.cue}>
          <span className="micro">прогорнути вниз</span>
          <span className={styles.cueLine} />
        </span>
        {/* The call to authors has its own section further down, with the
            heading that asks the question; repeating it here made the home
            page carry the same button twice. The hero opens the site
            instead — and on narrow screens, where the scroll cue is hidden,
            this is the only thing to press. */}
        <Link className={`pill ${styles.cta}`} href="/genres">
          Що ми видаємо
        </Link>
      </div>
    </section>
  );
}
