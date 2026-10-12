import { Fragment } from "react";
import type { Line } from "@/lib/journal";

/** One line of a Telegram post: bold, italic and links as the channel set them. */
export default function Runs({ line }: { line: Line }) {
  return (
    <>
      {line.map((r, i) => {
        let n: React.ReactNode = r.t;
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
