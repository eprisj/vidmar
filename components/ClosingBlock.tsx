import type { ReactNode } from "react";
import Reveal from "./Reveal";
import Seal from "./Seal";
import Smoke from "./Smoke";
import Subscribe from "./Subscribe";
import ScrollProgress from "./ScrollProgress";
import styles from "./ClosingBlock.module.css";

type Props = {
  label?: string;
  title?: string;
  text?: string;
  /** replaces the subscribe form */
  children?: ReactNode;
};

/** The way a page ends: smoke rising under a huge turning ring, one line and
 * one action in the middle of it. */
export default function ClosingBlock({
  label = "розсилка",
  title = "Дізнайтесь першими про вихід книги",
  text = "Без спаму — тільки дата виходу, анонси та новини видавництва.",
  children,
}: Props) {
  return (
    <ScrollProgress className={`ink pad ${styles.root}`} data-field="dark" data-candle="">
      <Smoke intensity={0.8} source={[0.5, 0.0]} />
      <div className={styles.ring} aria-hidden="true">
        <Seal star={false} />
      </div>
      <div className={`wrapMax ${styles.in}`}>
        <Reveal>
          <span className="micro">{label}</span>
        </Reveal>
        <Reveal delay={90}>
          <h2 className="statement">{title}</h2>
        </Reveal>
        {text && (
          <Reveal delay={160}>
            <p className="body" style={{ textAlign: "center" }}>
              {text}
            </p>
          </Reveal>
        )}
        <Reveal delay={230}>{children ?? <Subscribe />}</Reveal>
      </div>
    </ScrollProgress>
  );
}
