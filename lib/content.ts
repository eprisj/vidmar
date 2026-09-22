export const EMAIL = "vidmarpublishing@gmail.com";

export type Genre = {
  slug: string;
  title: string;
  tint: string;
  /** the two the founder named first — everything else is "also interested in" */
  primary: boolean;
  note: string;
};

/** The publisher's real focus, in the order the founder listed it. */
export const genres: Genre[] = [
  {
    slug: "ezoteryka",
    title: "Езотерика й містика",
    tint: "#16284c",
    primary: true,
    note: "Основний напрям видавництва",
  },
  {
    slug: "vidmovstvo",
    title: "Відьомство й духовні практики",
    tint: "#1c2446",
    primary: true,
    note: "Основний напрям видавництва",
  },
  {
    slug: "tryler",
    title: "Трилери",
    tint: "#24223e",
    primary: false,
    note: "",
  },
  {
    slug: "psyhroman",
    title: "Психологічні романи",
    tint: "#142c45",
    primary: false,
    note: "",
  },
  {
    slug: "fentezi",
    title: "Фентезі",
    tint: "#162c3a",
    primary: false,
    note: "",
  },
  {
    slug: "mistyka-proza",
    title: "Містична проза",
    tint: "#222838",
    primary: false,
    note: "І просто сильні, нестандартні тексти",
  },
];

/** The founder's own letter — used near-verbatim on the about page and in
 * excerpt form on the home page. Keep the voice; only line-break into
 * paragraphs for the layout. */
export const founderLetter = [
  "Дякую всім, хто вже повірив у цей проєкт: читацькій спільноті та моїм підписникам – кожному, хто підтримує мене ще на самому старті.",
  "Окрема подяка моїй інтернет-родині – людям, які справді люблять читати, цікавляться містикою, езотерикою й нестандартною літературою. Саме завдяки вам я знаю, що в таких книг є свій читач – уважний, зацікавлений і готовий підтримувати нові імена та нові видання.",
  "Я давно хотів створити власне видавництво і нарешті вирішив не відкладати цю мрію.",
  "Разом із моєю партнеркою та подругою Марією, яка свого часу закохала мене в читання, ми починаємо цей шлях із нуля. Я чудово розумію, що це складний, дорогий і дуже енергозатратний процес. Але мені хочеться створити простір, де виходитимуть мої книги та праці інших авторів, яким близькі наші цінності й естетика.",
];

/** Used directly under the wordmark on the home page and under the ВІДЬМАР
 * heading on the about page — in both places the name has just been said in
 * the largest type on the screen, so the line doesn't repeat it. */
export const positioning = "Бутикове видавництво особливих книг.";

export const focusText =
  "Основний напрям – езотерика, містика, відьомство та духовні практики. Також нам дуже цікаві трилери, психологічні романи, фентезі, містична проза й просто сильні, нестандартні художні тексти – особливо ті, які не завжди легко вписати у звичні рамки великого видавничого ринку.";

export const status = [
  {
    n: "01",
    title: "Готуємо перше видання",
    body: "Зараз я готую до випуску власну книгу – це перша робота видавництва.",
  },
  {
    n: "02",
    title: "Формуємо команду",
    body: "Ми лише починаємо, тож поки що не маємо змоги брати в роботу сирі тексти, які потребують глибокої редакторської правки.",
  },
  {
    n: "03",
    title: "Відкриті до співпраці",
    // The conditions themselves live on /submissions and were being restated
    // here, in the block below and twice again on that page. This line keeps
    // only what the other three don't say: that you can write today.
    body: "Готовий, вичитаний рукопис можна надсилати вже зараз.",
  },
];

export const submissionRules = [
  "Рукопис завершений – не уривок і не начерк.",
  "Текст вичитаний, бажано вже відредагований.",
  "Разом із рукописом – трохи інформації про себе.",
];

/** Sits under the three conditions on /submissions and explains why they are
 * what they are. The trailing clause used to repeat the conditions it had just
 * followed, so it now carries only the reason. */
export const submissionNote =
  "Поки ми лише формуємо команду, тому глибоку редакторську правку сирих текстів узяти в роботу ще не маємо змоги.";

/** The three sections the journal will open with. Nothing is published yet,
 * so the page shows them as what they are — planned, not written. Titles are
 * the ones the journal page already named in prose. */
export const journalRubrics = [
  "Нотатки про підготовку видання",
  "Розмови з авторами",
  "Полиця редакції",
];

export type TarotCard = {
  slug: string;
  file: string;
  name: string;
  meaning: string;
};

/** The ten Major Arcana currently scanned (Rider–Waite–Smith, 1909, public
 * domain — Pamela Colman Smith died 1951, so the deck itself is out of
 * copyright everywhere the site is read). Card of the day picks from this
 * set by date, not the full 22, until the rest are in. */
export const tarotDeck: TarotCard[] = [
  { slug: "fool", file: "00-fool", name: "Блазень", meaning: "Початок із чистого аркуша – крок у невідоме без страху." },
  { slug: "magician", file: "01-magician", name: "Маг", meaning: "Усі інструменти вже у ваших руках – лишилося захотіти." },
  { slug: "high-priestess", file: "02-high-priestess", name: "Верховна Жриця", meaning: "Те, що не сказане вголос, часто важливіше за сказане." },
  { slug: "empress", file: "03-empress", name: "Імператриця", meaning: "Щедрість, яка росте сама, коли їй не заважати." },
  { slug: "emperor", file: "04-emperor", name: "Імператор", meaning: "Порядок, побудований на досвіді, а не на страху." },
  { slug: "hierophant", file: "05-hierophant", name: "Ієрофант", meaning: "Традицію варто зрозуміти, перш ніж їй заперечити." },
  { slug: "lovers", file: "06-lovers", name: "Закохані", meaning: "Вибір, який промовляє більше за будь-яку клятву." },
  { slug: "chariot", file: "07-chariot", name: "Колісниця", meaning: "Рух уперед силою волі, навіть коли коні тягнуть у різні боки." },
  { slug: "strength", file: "08-strength", name: "Сила", meaning: "Лагідність, яка приборкує краще за грубу силу." },
  { slug: "hermit", file: "09-hermit", name: "Відлюдник", meaning: "Світло, яке несеш сам, коли компанії більше немає." },
];
