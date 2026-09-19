import type { ReactNode } from "react";
import Atmosphere from "./Atmosphere";
import Smoke from "./Smoke";
import Seal from "./Seal";
import ScrollProgress from "./ScrollProgress";
import styles from "./PageHero.module.css";

type Props = {
  label: string;
  title: string;
  lede?: string;
  /** picks one of Atmosphere's hand-cut seams, so each page opens on its own rock */
  variant?: number;
  children?: ReactNode;
};

/**
 * How every inner page opens: dark stone, living smoke, the ring turning
 * with the scroll behind a title that comes into focus.
 */
export default function PageHero({ label, title, lede, variant = 0, children }: Props) {
  return (
    <ScrollProgress className={styles.root} data-field="dark" data-candle="">
      <Atmosphere variant={variant} watermark={false} />
      <Smoke intensity={0.75} source={[0.72, 0.0]} />
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
      <span className={styles.cue} aria-hidden="true" />
    </ScrollProgress>
  );
}
