import p from "./plus.module.css";

/** how a page reads in a Google result: title cut at ~60, description at ~160 */
export default function SerpPreview({ title, description, url }: { title: string; description: string; url: string }) {
  const cut = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t);
  return (
    <div className={p.serp} aria-label="Як виглядатиме в Google">
      <span className={p.serpUrl}>{url.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/\//g, " › ")}</span>
      <span className={p.serpTitle}>{cut(title || "Заголовок сторінки", 62)}</span>
      <span className={p.serpDesc}>{cut(description || "Опис, який побачать у результатах пошуку.", 160)}</span>
    </div>
  );
}

/** a counter that turns amber past the length search engines show */
export function Count({ n, max }: { n: number; max: number }) {
  return <span className={n > max ? p.countOver : p.count}>{n} / {max}</span>;
}
