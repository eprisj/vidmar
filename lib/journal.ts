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

/** The pictures of the journal, all from the public domain and each set in the
 * house's blue: celestial maps (Cellarius), Doré's plates, Bilibin and
 * Vasnetsov for the old tales, Dürer, Goya, and the tarot cards of
 * public/tarot. A text that came with its own photograph shows that and keeps
 * its plate for the head of the page; one that did not gets the plate for its
 * cover, and a text about an arcana has that card laid on the plate. */
export type Art = { plate: string; card?: string };
const ART: Record<string, Art> = {
  "pershyi-rozklad": { plate: "cellarius-copernicus", card: "00-fool" },
  "choho-karty-movchat": { plate: "cellarius-luna", card: "02-high-priestess" },
  "scho-rozpovist-rozklad": { plate: "cellarius-arateum", card: "01-magician" },
  "arkan-kliuch": { plate: "cellarius-ptolemaicum", card: "05-hierophant" },
  "kolir-u-kartakh": { plate: "cellarius-magnitudines", card: "03-empress" },
  "prostir-arkaniv": { plate: "cellarius-brahea", card: "07-chariot" },
  "travy-ta-arkany": { plate: "dore-garden", card: "08-strength" },
  "arkany-porohy": { plate: "dore-lethe-angel", card: "09-hermit" },
  "skhidne-taro-hanjyfa": { plate: "cellarius-orbis" },
  "rytual-ochyshchennia-kolody": { plate: "dore-lethe" },
  "kamin-oberih-domu": { plate: "dore-tree" },
  "pershyi-porih": { plate: "dore-forest" },
  "valpurhiieva-nich": { plate: "bilibin-flight" },
  "prysisty-na-dorizhku": { plate: "bilibin-vasilisa" },
  "vyshyvanka-inzheneriia": { plate: "bilibin-maria" },
  "velesova-nich": { plate: "vasnetsov-alyonushka" },
  "tykhe-remeslo": { plate: "durer-melencolia" },
  "odyn-namir": { plate: "dore-angels" },
  sluzhnytsia: { plate: "goya-sleep" },
};
/** In a text that goes through the arcana one by one, the card that stands
 * beside each: the first word of the line, lower case, to the card file. An
 * arcana without a card of its own yet shows the back of the deck. */
export const CARDS_IN: Record<string, Record<string, string>> = {
  "prostir-arkaniv": {
    жриця: "02-high-priestess",
    імператриця: "03-empress",
    маг: "01-magician",
    колісниця: "07-chariot",
    дурень: "00-fool",
    місяць: "18-moon",
    башта: "16-tower",
    зірка: "17-star",
  },
};

/** the plate behind the head of a text that has none of its own */
const RUBRIC_PLATE: Record<string, string> = {
  taro: "cellarius-copernicus",
  obriad: "dore-forest",
  mif: "bilibin-vasilisa",
  dumky: "durer-melencolia",
  polytsia: "goya-sleep",
};
export const artFor = (e: Entry): Art | null => ART[e.slug] ?? null;
export const plateFor = (e: Entry): string => ART[e.slug]?.plate ?? RUBRIC_PLATE[e.rubric] ?? "cellarius-copernicus";

/** who drew the plate, for the line under the head of a text */
export function creditFor(plate: string): string {
  if (plate.startsWith("cellarius")) return "Андреас Целларіус, «Harmonia Macrocosmica», 1660";
  if (plate === "dore-forest") return "Гюстав Доре, ілюстрація до «Сказання старого моряка», 1876";
  if (plate.startsWith("dore")) return "Гюстав Доре, ілюстрація до «Божественної комедії», 1861–1868";
  if (plate === "bilibin-vasilisa") return "Іван Білібін, «Василиса Прекрасна», 1899";
  if (plate.startsWith("bilibin")) return "Іван Білібін, ілюстрація до казки, 1900";
  if (plate.startsWith("vasnetsov")) return "Віктор Васнецов, «Альонушка», 1881";
  if (plate.startsWith("durer")) return "Альбрехт Дюрер, «Меланхолія I», 1514";
  if (plate.startsWith("goya")) return "Франсіско Гойя, «Сон розуму народжує чудовиськ», 1799";
  return "Гюстав Доре";
}

/** a line from the text, set large in the middle of it */
export const PULL: Record<string, string> = {
  "pershyi-porih": "Новий шлях ніколи не починається зі старого кроку.",
  "tykhe-remeslo": "Справжнє не завжди ховається. Але воно ніколи не потребує безперервно доводити, що воно справжнє.",
  "valpurhiieva-nich": "Вальпургієва ніч — не про страх. Це ніч пам’яті про те, ким ми були.",
  "velesova-nich": "Головне — не назва свята, а те світло, яке воно приносить.",
  "vyshyvanka-inzheneriia": "Навіть чорний колір у нас може говорити не про кінець, а про коріння, силу й продовження життя.",
  "odyn-namir": "Ти маєш право жити в своєму ритмі.",
  "prysisty-na-dorizhku": "Ця коротка мить спокою заряджає нас мудрістю предків та позитивною енергією на весь шлях.",
  "skhidne-taro-hanjyfa": "Це справжня естетика давнього Сходу, де азарт переплітається з філософією.",
};

/** the text the journal opens on: an old rite with a picture */
export const FEATURED = "velesova-nich";

/** the three texts the home page shows, from three rubrics; the newest ones if a slug is gone */
export const HOME = ["pershyi-porih", "velesova-nich", "skhidne-taro-hanjyfa"];
export const homeEntries = (): Entry[] => {
  const picked = HOME.map((s) => entries.find((e) => e.slug === s)).filter((e): e is Entry => !!e);
  return picked.length === 3 ? picked : entries.slice(0, 3);
};

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
