import type { ReactNode } from "react";
import Atmosphere from "./Atmosphere";
import Seal from "./Seal";
import ScrollProgress from "./ScrollProgress";
import styles from "./PageHero.module.css";

type Props = {
  label: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  /** picks one of Atmosphere's hand-cut seams, so each page opens on its own rock */
  variant?: number;
  /** a shorter hero for pages whose content is the point */
  compact?: boolean;
  children?: ReactNode;
};

/**
 * How every inner page opens: dark stone and the ring turning with the
 * scroll, behind a title that comes into focus. The smoke and light beam
 * that used to sit over the stone read as generic mystic-stock-photo fog —
 * exactly the flat, generated look the etched home hero was built to move
 * away from — so the rock's own seam and gold veins carry the atmosphere
 * alone now.
 */
export default function PageHero({ label, title, lede, variant = 0, compact = false, children }: Props) {
  return (
    <ScrollProgress className={`deep ${styles.root} ${compact ? styles.compact : ""}`} data-field="dark" data-candle="">
      <Atmosphere variant={variant} watermark={false} />
      <div className={styles.ring} aria-hidden="true">
        <Seal star={false} />
      </div>
      <div className={`wrapMax ${styles.in}`}>
        <span className={`micro micro--bright ${styles.label}`}>
          <span className={styles.star}>
            <Seal ticks={0} emblem />
          </span>
          {label}
        </span>
        <h1 className={styles.title}>{title}</h1>
        {lede && <p className={styles.lede}>{lede}</p>}
        {children}
      </div>
    </ScrollProgress>
  );
}
