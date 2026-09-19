import Seal from "./Seal";
import styles from "./Atmosphere.module.css";

type Props = {
  className?: string;
  /** a whisper of colour in the rock itself — the gold vein stays the only bright accent */
  tint?: string;
  /** 0–5: gives this instance its own seam angle/position and a rotated,
   * oversized seal watermark, so a row of tiles doesn't read as one
   * texture recoloured six times */
  variant?: number;
  /** the rotated seal watermark that comes with a variant; off where type
   * sits on top, so the star's lines don't cut through a title */
  watermark?: boolean;
};

/** Six hand-picked breaks, not a random one — so neighbouring tiles never
 * happen to roll the same angle. */
const SEAMS = [
  { x: 46, rot: 9, w: 16 },
  { x: 26, rot: -8, w: 22 },
  { x: 66, rot: 14, w: 13 },
  { x: 16, rot: 6, w: 25 },
  { x: 76, rot: -13, w: 12 },
  { x: 54, rot: -5, w: 19 },
];

/** The full-bleed dark backdrop: broken stone, a seam of light, gold veins.
 * Purely generated — no photography, nothing to license or load. */
export default function Atmosphere({ className = "", tint, variant, watermark = true }: Props) {
  const seam = variant != null ? SEAMS[variant % SEAMS.length] : null;

  const style = {
    ...(tint ? { "--tint": tint } : {}),
    ...(seam
      ? {
          "--seam-x": `${seam.x}%`,
          "--seam-rot": `${seam.rot}deg`,
          "--seam-w": `${seam.w}%`,
          "--edge-rot": `${seam.rot * 0.6}deg`,
          "--mark-rot": `${seam.rot * 5}deg`,
        }
      : {}),
  } as React.CSSProperties;

  return (
    <div className={`${styles.root} ${className}`} style={style} aria-hidden="true">
      <span className={styles.seam} />
      <span className={styles.edges} />
      {seam && watermark && (
        <span className={styles.mark}>
          <Seal />
        </span>
      )}
      <span className={styles.veins} />
      <span className={styles.vignette} />
      <span className={styles.grain} />
    </div>
  );
}
