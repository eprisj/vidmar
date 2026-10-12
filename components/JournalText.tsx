import type { Line } from "@/lib/journal";
import { layout } from "@/lib/journal-layout";
import type { Block } from "@/lib/journal";
import Runs from "./Runs";
import styles from "./JournalText.module.css";

const Lines = ({ lines }: { lines: Line[] }) => (
  <>
    {lines.map((l, i) => (
      <span key={i} className={styles.line}>
        <Runs line={l} />
      </span>
    ))}
  </>
);

/** A journal text set for reading: a lead paragraph, headings, numbered steps,
 * glossaries, spoken formulas and verse each in their own form. */
export default function JournalText({ blocks }: { blocks: Block[] }) {
  const nodes = layout(blocks);
  return (
    <div className={styles.text}>
      {nodes.map((n, i) => {
        switch (n.kind) {
          case "lede":
            return (
              <p key={i} className={styles.lede}>
                <Lines lines={n.lines} />
              </p>
            );
          case "h":
            return (
              <h2 key={i} className={styles.h}>
                {n.text}
              </h2>
            );
          case "verse":
            return (
              <p key={i} className={styles.verse}>
                <Lines lines={n.lines} />
              </p>
            );
          case "quote":
            return (
              <blockquote key={i} className={styles.quote}>
                <Lines lines={n.lines} />
              </blockquote>
            );
          case "ol":
            return (
              <ol key={i} className={styles.ol}>
                {n.items.map((it, k) => (
                  <li key={k}>
                    <Lines lines={it} />
                  </li>
                ))}
              </ol>
            );
          case "ul":
            return (
              <ul key={i} className={styles.ul}>
                {n.items.map((it, k) => (
                  <li key={k}>
                    <Lines lines={it} />
                  </li>
                ))}
              </ul>
            );
          case "terms":
            return (
              <dl key={i} className={styles.terms}>
                {n.items.map((it, k) => (
                  <div key={k}>
                    <dt>
                      <Runs line={it.term} />
                    </dt>
                    {it.note.length > 0 && (
                      <dd>
                        <Lines lines={it.note} />
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            );
          default:
            return (
              <p key={i}>
                <Lines lines={n.lines} />
              </p>
            );
        }
      })}
    </div>
  );
}
