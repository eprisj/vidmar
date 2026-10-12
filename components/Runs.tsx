import { Fragment } from "react";
import type { Line } from "@/lib/journal";
import { typo } from "@/lib/typo";
import styles from "./JournalText.module.css";

/** One line of a Telegram post: bold, italic and links as the channel set them. */
export default function Runs({ line }: { line: Line }) {
  return (
    <>
      {line.map((r, i) => {
        const prev = line.slice(0, i).map((q) => q.t).join("");
        const t = typo(r.t, prev);
        let n: React.ReactNode = (r as { cap?: boolean }).cap ? <CapText t={t} /> : (r as { sc?: boolean }).sc ? <span className={styles.sc}>{t}</span> : t;
        if (r.i) n = <em>{n}</em>;
        if (r.b) n = <strong>{n}</strong>;
        if (r.href)
          n = (
            <a href={r.href} target="_blank" rel="noopener noreferrer">
              {n}
            </a>
          );
        return <Fragment key={i}>{n}</Fragment>;
      })}
    </>
  );
}

/** «Я» of the first word: the quote mark, if any, stays small beside the capital */
function CapText({ t }: { t: string }) {
  const m = /^(\s*[«"“]?)(.)$/.exec(t);
  return m ? (
    <>
      {m[1]}
      <span className={styles.cap}>{m[2]}</span>
    </>
  ) : (
    <>{t}</>
  );
}
