/**
 * Every site text the admin can change, with the text built into the site as
 * its default. The site renders the default (so the static pages and search
 * engines always have it), then swaps in whatever the admin saved – see
 * components/SiteText.tsx. The admin's «Контент» page is generated from this
 * list, so adding a field here is all it takes to make a text editable.
 */
import { EMAIL, founderLetter, positioning, status, submissionNote, submissionRules } from "./content";

export type FieldKind = "text" | "long" | "list" | "records";

export type TextField = {
  key: string;
  section: string;
  label: string;
  kind: FieldKind;
  default: string | string[] | Record<string, string>[];
  /** for records: the parts of each item */
  parts?: { key: string; label: string; long?: boolean }[];
  hint?: string;
  /** where to look at it on the site */
  page: string;
};

export const TEXT_FIELDS: TextField[] = [
  // --- загальне
  {
    key: "site.status_line",
    section: "Загальне",
    label: "Рядок про стан видавництва",
    kind: "text",
    default: "Перше видання – у підготовці",
    hint: "Внизу першого екрана головної і в підвалі кожної сторінки.",
    page: "/",
  },
  {
    key: "site.email",
    section: "Загальне",
    label: "Пошта для звʼязку",
    kind: "text",
    default: EMAIL,
    hint: "Підвал, сторінка «Авторам», умови та політика конфіденційності.",
    page: "/",
  },
  {
    key: "footer.tagline",
    section: "Загальне",
    label: "Підпис під логотипом у підвалі",
    kind: "text",
    default: "Книги про езотерику, містику й відьомство.",
    page: "/",
  },

  // --- головна
  {
    key: "home.slogan",
    section: "Головна",
    label: "Рукописний рядок під логотипом",
    kind: "text",
    default: "книги про містику й відьомство",
    hint: "Рукописний шрифт погано читається в довгих фразах – краще 3–6 слів.",
    page: "/",
  },
  {
    key: "home.positioning",
    section: "Головна",
    label: "Фраза на гравюрі (другий екран)",
    kind: "text",
    default: positioning,
    page: "/",
  },
  {
    key: "home.status",
    section: "Головна",
    label: "Блок «Зараз»",
    kind: "records",
    default: status,
    parts: [
      { key: "title", label: "Заголовок" },
      { key: "body", label: "Текст", long: true },
    ],
    page: "/",
  },
  {
    key: "home.submit_title",
    section: "Головна",
    label: "Блок для авторів: заголовок",
    kind: "text",
    default: "У вас є готовий рукопис?",
    page: "/",
  },
  {
    key: "home.submit_text",
    section: "Головна",
    label: "Блок для авторів: текст",
    kind: "long",
    default: "Надсилайте текст і кілька слів про себе – будемо знайомитися.",
    page: "/",
  },

  // --- лист засновника
  {
    key: "letter.thanks",
    section: "Лист засновника",
    label: "Абзац 1 · подяка",
    kind: "long",
    default: founderLetter[0],
    page: "/about",
  },
  {
    key: "letter.family",
    section: "Лист засновника",
    label: "Абзац 2 · інтернет-родина",
    kind: "long",
    default: founderLetter[1],
    page: "/about",
  },
  {
    key: "letter.dream",
    section: "Лист засновника",
    label: "Абзац 3 · мрія (крупно, також на головній)",
    kind: "long",
    default: founderLetter[2],
    page: "/about",
  },
  {
    key: "letter.together",
    section: "Лист засновника",
    label: "Абзац 4 · разом із Марією (також на головній)",
    kind: "long",
    default: founderLetter[3],
    page: "/about",
  },

  // --- сторінки
  { key: "page.about.title", section: "Заголовки сторінок", label: "Про нас · заголовок", kind: "text", default: "Простір для особливих книг", page: "/about" },
  { key: "page.about.lede", section: "Заголовки сторінок", label: "Про нас · підзаголовок", kind: "long", default: "Починаємо з нуля – вдвох, із любові до читання.", page: "/about" },
  { key: "page.genres.title", section: "Заголовки сторінок", label: "Напрями · заголовок", kind: "text", default: "Що ми видаємо", page: "/genres" },
  { key: "page.catalog.title", section: "Заголовки сторінок", label: "Каталог · заголовок", kind: "text", default: "Книги ВІДЬМАР", page: "/catalog" },
  { key: "page.journal.title", section: "Заголовки сторінок", label: "Журнал · заголовок", kind: "text", default: "Скоро тут будуть записи", page: "/journal" },
  { key: "page.submissions.title", section: "Заголовки сторінок", label: "Авторам · заголовок", kind: "text", default: "Надіслати рукопис", page: "/submissions" },
  { key: "page.submissions.lede", section: "Заголовки сторінок", label: "Авторам · підзаголовок", kind: "long", default: "Ми читаємо кожен рукопис, що надходить.", page: "/submissions" },

  // --- авторам
  {
    key: "submissions.rules",
    section: "Авторам",
    label: "Що потрібно (пункти)",
    kind: "list",
    default: submissionRules,
    page: "/submissions",
  },
  {
    key: "submissions.note",
    section: "Авторам",
    label: "Примітка під пунктами",
    kind: "long",
    default: submissionNote,
    page: "/submissions",
  },
  {
    key: "submissions.form_lead",
    section: "Авторам",
    label: "Текст над формою",
    kind: "long",
    default: "Опис і посилання на текст – повний рукопис попросимо, якщо зацікавимось.",
    page: "/submissions",
  },
];

export const TEXT_DEFAULTS: Record<string, TextField["default"]> = Object.fromEntries(
  TEXT_FIELDS.map((f) => [f.key, f.default]),
);
