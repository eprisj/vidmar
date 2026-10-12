import { Fragment } from "react";
import type { Line, Mark } from "@/lib/journal";
import { layout } from "@/lib/journal-layout";
import type { Block } from "@/lib/journal";
import Runs from "./Runs";
import Seal from "./Seal";
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

/** «Жриця — тиха вода, берег» in two parts: the name, and what stands round it */
function splitHead(line: Line): { name: string; where: string } | null {
  const raw = line.map((r) => r.t).join("").replace(/\s+/g, " ").trim();
  const at = raw.indexOf(" — ");
  if (at < 1 || at > 30) return null;
  const where = raw.slice(at + 3).trim();
  return where ? { name: raw.slice(0, at).trim(), where: where.charAt(0).toUpperCase() + where.slice(1) } : null;
}

/** the first words after the cap, to be set in capitals the way a book opens a chapter */
function openWords(lines: Line[]): Line[] {
  const first = lines[0];
  const at = first?.findIndex((r) => !(r as { cap?: boolean }).cap && r.t.trim());
  if (!first || at === undefined || at < 0) return lines;
  const r = first[at];
  const m = /^(\s*\S+(?:\s+\S+){0,1})(?=\s|$)/.exec(r.t);
  if (!m || m[1].length > 24 || at !== (first[0] && (first[0] as { cap?: boolean }).cap ? 1 : 0)) return lines;
  const head = { ...r, t: m[1], sc: true } as typeof r & { sc: boolean };
  const rest = { ...r, t: r.t.slice(m[1].length) };
  const out = [...first.slice(0, at), head, ...(rest.t ? [rest] : []), ...first.slice(at + 1)];
  return [out, ...lines.slice(1)];
}

/** A journal text set for reading: a lead paragraph, headings, numbered steps,
 * glossaries, spoken formulas and verse each in their own form. */
export default function JournalText({ blocks, pull, cards, marks }: { blocks: Block[]; pull?: string; cards?: Record<string, string>; marks?: Record<string, Mark> }) {
  const nodes = layout(blocks);
  // a line from the text, set large a little before the middle, between two paragraphs
  let at = -1;
  if (pull && nodes.length >= 6) {
    for (let k = Math.round(nodes.length * 0.42); k < nodes.length - 1; k++) {
      const prose = (x: string) => x === "p" || x === "stanza";
      if (prose(nodes[k - 1].kind) && (prose(nodes[k].kind) || nodes[k].kind === "h")) { at = k; break; }
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
          case "lede": {
            // a line that leads into a list is no opening: it keeps no drop cap
            const leadIn = /:\s*$/.test(n.lines.map((l) => l.map((r) => r.t).join("")).join(" "));
            return (
              <p key={i} className={styles.lede}>
                <Lines lines={leadIn ? n.lines : openWords(dropCap(n.lines))} />
              </p>
            );
          }
          case "stanza":
            return (
              <p key={i} className={i === nodes.length - 1 && n.lines.length === 1 ? styles.closing : styles.stanza}>
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
          case "terms": {
            // «Name — setting» then «→ meaning»: each one set as an entry, with its card when the text has them
            const plain = (l: Line) => l.map((r) => r.t).join("").replace(/\s+/g, " ").trim();
            // a glossary with a sign beside each term: a numeral, a swatch
            if (marks && n.items.some((it) => marks[plain(it.term).toLowerCase()])) {
              return (
                <ol key={i} className={`${styles.entries} ${styles.withCards}`}>
                  {n.items.map((it, k) => {
                    const name = plain(it.term);
                    const m = marks[name.toLowerCase()];
                    return (
                      <li key={k} className={styles.entry}>
                        <span className={styles.sign} aria-hidden="true">
                          {m && "roman" in m && <span className={styles.roman}>{m.roman}</span>}
                          {m && "color" in m && <span className={styles.swatch} style={{ background: m.color }} />}
                        </span>
                        <span className={styles.entryBody}>
                          <span className={styles.name}>{name}</span>
                          <span className={styles.note}>
                            <Lines lines={it.note} />
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              );
            }
            const heads = n.items.map((it) => splitHead(it.term));
            const entries = heads.every((h) => h) && n.items.every((it) => it.note.length > 0);
            if (!entries) {
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
            }
            const withCards = !!cards && heads.some((h) => cards[h!.name.toLowerCase()]);
            return (
              <ol key={i} className={`${styles.entries} ${withCards ? styles.withCards : ""}`}>
                {n.items.map((it, k) => {
                  const h = heads[k]!;
                  const card = cards?.[h.name.toLowerCase()];
                  return (
                    <li key={k} className={styles.entry}>
                      {withCards && (
                        <span className={`${styles.thumb} ${k % 2 ? styles.tiltR : styles.tiltL}`} aria-hidden="true">
                          {card ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`/tarot/${card}-xs.webp`} alt="" loading="lazy" decoding="async" />
                          ) : (
                            <span className={styles.back}>
                              <span className={styles.backMark}>
                                <Seal star emblem />
                              </span>
                            </span>
                          )}
                        </span>
                      )}
                      <span className={styles.entryBody}>
                        <span className={styles.name}>{h.name}</span>
                        <span className={styles.where}>{h.where}</span>
                        <span className={styles.meaning}>
                          <span className={styles.arrow} aria-hidden="true">
                            →
                          </span>
                          <Lines lines={it.note} />
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            );
          }
          default:
            return (
              <p key={i} className={i === nodes.length - 1 && i >= 4 && n.lines.length === 1 && n.lines[0].map((r) => r.t).join("").length <= 40 ? styles.closing : undefined}>
                <Lines lines={n.lines} />
              </p>
            );
        }
  }
}
