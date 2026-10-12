import { Fragment } from "react";
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

/** the first letter of a line, set as a drop cap, and the rest as it was */
function dropCap(lines: Line[]): Line[] {
  const first = lines[0]?.[0];
  if (!first || !/^\s*[«"“]?[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(first.t)) return lines;
  const m = /^(\s*[«"“]?)([A-Za-zА-Яа-яІіЇїЄєҐґ])/.exec(first.t)!;
  const head = { ...first, t: m[1] + m[2], cap: true } as typeof first & { cap: boolean };
  const rest = { ...first, t: first.t.slice(m[0].length) };
  return [[head, ...(rest.t ? [rest] : []), ...lines[0].slice(1)], ...lines.slice(1)];
}

/** A journal text set for reading: a lead paragraph, headings, numbered steps,
 * glossaries, spoken formulas and verse each in their own form. */
export default function JournalText({ blocks, pull }: { blocks: Block[]; pull?: string }) {
  const nodes = layout(blocks);
  // a line from the text, set large a little before the middle, between two paragraphs
  let at = -1;
  if (pull && nodes.length >= 6) {
    for (let k = Math.round(nodes.length * 0.42); k < nodes.length - 1; k++) {
      if (nodes[k - 1].kind === "p" && (nodes[k].kind === "p" || nodes[k].kind === "h")) { at = k; break; }
    }
  }
  return (
    <div className={styles.text}>
      {nodes.map((n, i) => {
        const pullQuote =
          i === at ? (
            <aside key={`pull-${i}`} className={styles.pull} aria-label="Цитата з тексту">
              <span className={styles.pullMark} aria-hidden="true">
                «
              </span>
              <p>{pull}</p>
            </aside>
          ) : null;
        return (
          <Fragment key={i}>
            {pullQuote}
            {renderNode(n, i)}
          </Fragment>
        );
      })}
    </div>
  );

  function renderNode(n: (typeof nodes)[number], i: number) {
        switch (n.kind) {
          case "lede":
            return (
              <p key={i} className={styles.lede}>
                <Lines lines={dropCap(n.lines)} />
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
  }
}
