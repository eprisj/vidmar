import raw from "./journal-data.json";

/** The journal reads from the public Telegram channels of the academy and its
 * founder. Which posts stand here is decided in scripts/journal-picks.json;
 * `npm run journal` fetches them into journal-data.json, which is committed,
 * so a build never waits on Telegram. */

export type Run = { t: string; b?: boolean; i?: boolean; href?: string };
export type Line = Run[];
/** a paragraph: its lines, kept as written (the academy's posts are set in short lines) */
export type Block = Line[];

export type Entry = {
  slug: string;
  rubric: string;
  title: string;
  dek: string;
  date: string;
  channel: string;
  post: number;
  url: string;
  image: string | null;
  minutes: number;
  blocks: Block[];
};

export const rubrics: { id: string; title: string; lede: string }[] = [
  { id: "taro", title: "Таро: читати й бачити", lede: "Як ставити питання, чому карти мовчать, що ховають кольори, трави й простір колоди." },
  { id: "obriad", title: "Обряд і практика", lede: "Прості практики, які можна зробити вдома, і думка про те, чому вони працюють." },
  { id: "mif", title: "Рід, свято, міф", lede: "Велесова й Вальпургієва ніч, вишиванка та звичай присісти на дорогу." },
  { id: "dumky", title: "Думки", lede: "Про тихе ремесло, наміри й рік, що починається без обіцянок." },
  { id: "polytsia", title: "Полиця редакції", lede: "Книжки, які варто прочитати." },
];

export const channels = [
  { handle: "lunnaria_academy", name: "Всесвіт Луннарії", note: "Telegram академії: аркан за арканом, ритуали сезону" },
  { handle: "yarlinscky", name: "Яр Линський", note: "Telegram: Таро, український міф і чаклунство" },
];

export const entries: Entry[] = (raw as Entry[]).slice().sort((a, b) => (a.date < b.date ? 1 : -1));

/** the text the journal opens on: an old rite with a picture */
export const FEATURED = "velesova-nich";

export const entryPath = (slug: string) => `/journal/${slug}`;
export const entryBySlug = (slug: string) => entries.find((e) => e.slug === slug);
export const rubricOf = (e: Entry) => rubrics.find((r) => r.id === e.rubric) ?? rubrics[0];
export const inRubric = (id: string) => entries.filter((e) => e.rubric === id);

/** the neighbours of an entry within its rubric, newest first */
export function around(slug: string) {
  const e = entryBySlug(slug);
  if (!e) return { prev: undefined, next: undefined };
  const list = inRubric(e.rubric);
  const i = list.findIndex((x) => x.slug === slug);
  return { prev: list[i + 1], next: list[i - 1] };
}

const months = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
/** «15 вересня 2026», written out so a build in any locale gives the same text */
export function dateText(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export const readTime = (m: number) => `${m} хв читання`;
