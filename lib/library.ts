import fs from "node:fs";
import path from "node:path";

/* The free library: books in the public domain, set whole on the site and in
   the iPhone app, which carries the same texts. One paragraph a line:
   `# part`, `@ speaker`, `> stage direction`, verse lines joined by U+2028. */

export type Block =
  | { t: "heading"; text: string; id: string }
  | { t: "speaker"; text: string }
  | { t: "remark"; text: string }
  | { t: "verse"; lines: string[] }
  | { t: "prose"; text: string; cap: boolean };

export type LibBook = {
  slug: string;
  title: string;
  author: string;
  year: number;
  /** one line, for the list and for the link card */
  dek: string;
  about: string;
  form: string;
  file: string;
  /** where the text was taken from */
  source: string;
};

export const libraryBooks: LibBook[] = [
  {
    slug: "lisova-pisnia",
    title: "Лісова пісня",
    author: "Леся Українка",
    year: 1911,
    form: "драма-феєрія",
    dek: "Мавка, Лісовик, Русалка й Перелесник у волинському лісі та пісня сопілки, що будить і губить.",
    about:
      "Драма-феєрія 1911 року, написана за три тижні в Кутаїсі, про Мавку, лісову дівчину, що покохала людину. Волинський ліс, Лісовик, Русалка, Водяник і Перелесник, пісня сопілки Лукаша, що пробуджує і губить. Головна українська книга про міфічні істоти.",
    file: "lisova-pisnia.txt",
    source: "uk.wikisource.org",
  },
  {
    slug: "tini-zabutykh-predkiv",
    title: "Тіні забутих предків",
    author: "Михайло Коцюбинський",
    year: 1911,
    form: "повість",
    dek: "Гуцульська повість про Івана й Марічку, мольфарів, чугайстра, нявку й трембіти над Черемошем.",
    about:
      "Гуцульська повість 1911 року про Івана й Марічку, що виросли по різні боки потоку роду, і про весь невидимий світ карпатських гір: чугайстра, нявку, щезника, трембіти й мольфарів. Одна з найвідоміших українських книг про магію повсякдення. Поділ на частини римськими цифрами – редакторський, за зірочками оригіналу.",
    file: "tini-zabutykh-predkiv.txt",
    source: "uk.wikisource.org (Твори, т. 2, Нью-Йорк, 1955)",
  },
];

export const libraryPath = (slug: string) => `/library/${slug}`;
export const libraryBySlug = (slug: string) => libraryBooks.find((b) => b.slug === slug);

const VERSE = " ";

export function loadBlocks(book: LibBook): Block[] {
  const text = fs.readFileSync(path.join(process.cwd(), "content", "library", book.file), "utf8");
  const out: Block[] = [];
  let afterHeading = true;
  let n = 0;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("# ")) {
      out.push({ t: "heading", text: line.slice(2), id: `p${++n}` });
      afterHeading = true;
    } else if (line.startsWith("@ ")) out.push({ t: "speaker", text: line.slice(2) });
    else if (line.startsWith("> ")) out.push({ t: "remark", text: line.slice(2) });
    else if (line.includes(VERSE)) out.push({ t: "verse", lines: line.split(VERSE) });
    else {
      out.push({ t: "prose", text: line, cap: afterHeading && line.length > 80 });
      afterHeading = false;
    }
  }
  return out;
}

/** minutes of reading at about 180 words a minute, six letters to a word */
export function minutesFor(blocks: Block[]): number {
  const letters = blocks.reduce(
    (s, b) => s + (b.t === "verse" ? b.lines.join(" ").length : b.t === "heading" ? 0 : b.text.length),
    0,
  );
  return Math.max(1, Math.round(letters / 6 / 180));
}

export function readTime(min: number): string {
  if (min < 60) return `${min} хв читання`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} год ${m} хв читання` : `${h} год читання`;
}
