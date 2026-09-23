"use client";

import Reveal from "./Reveal";
import { useSiteText } from "./SiteText";

/** the home page's «зараз» rows, editable from the admin */
export default function StatusRows({ row, title }: { row: string; title: string }) {
  const items = useSiteText<{ title?: string; body?: string }[]>("home.status");
  return (
    <>
      {items.map((s, i) => (
        <Reveal key={`${i}-${s.title}`} delay={i * 90}>
          <div className={row}>
            <span className={title}>{s.title}</span>
            <p className="body">{s.body}</p>
          </div>
        </Reveal>
      ))}
    </>
  );
}
