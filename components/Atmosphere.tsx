import styles from "./Atmosphere.module.css";

/** The full-bleed dark backdrop: broken stone, a seam of light, gold veins.
 * Purely generated — no photography, nothing to license or load. */
export default function Atmosphere({ className = "" }: { className?: string }) {
  return (
    <div className={`${styles.root} ${className}`} aria-hidden="true">
      <span className={styles.seam} />
      <span className={styles.edges} />
      <span className={styles.veins} />
      <span className={styles.vignette} />
      <span className={styles.grain} />
    </div>
  );
}
