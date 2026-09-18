import styles from "./Atmosphere.module.css";

type Props = {
  className?: string;
  /** a whisper of colour in the rock itself — the gold vein stays the only bright accent */
  tint?: string;
};

/** The full-bleed dark backdrop: broken stone, a seam of light, gold veins.
 * Purely generated — no photography, nothing to license or load. */
export default function Atmosphere({ className = "", tint }: Props) {
  return (
    <div
      className={`${styles.root} ${className}`}
      style={tint ? ({ "--tint": tint } as React.CSSProperties) : undefined}
      aria-hidden="true"
    >
      <span className={styles.seam} />
      <span className={styles.edges} />
      <span className={styles.veins} />
      <span className={styles.vignette} />
      <span className={styles.grain} />
    </div>
  );
}
