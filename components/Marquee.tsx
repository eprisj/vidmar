import Seal from "./Seal";
import styles from "./Marquee.module.css";

/** A giant band of words drifting sideways; filled and outlined in turn. */
export default function Marquee({ words }: { words: string[] }) {
  const run = (hidden: boolean) => (
    <div className={styles.run} aria-hidden={hidden || undefined}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className={styles.item}>
          <span className={i % 2 ? styles.outline : styles.fill}>{w}</span>
          <span className={styles.star}>
            <Seal ticks={0} emblem />
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={styles.root}>
      <div className={styles.track}>
        {run(false)}
        {run(true)}
      </div>
    </div>
  );
}
