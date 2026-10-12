/** Slips of the channel's own text, set right on the page. The posts are not
 * edited at the source (npm run journal fetches them again), so a known slip
 * is mended here. */
const FIXES: [string, string][] = [["фундаментальну помилка", "фундаментальну помилку"]];

/** The small things a typesetter does before a text goes to the page: the
 * quotes of the language, the long dash with its space held to the word
 * before it, the apostrophe, the ellipsis, and short words that must not be
 * left at the end of a line. The posts come as typed in Telegram; this sets
 * them as a book would. Applied when drawing, never to the stored text. */
const OPENS = /[\s(\[ —–«„“]/;
const LETTER = /[A-Za-zА-Яа-яІіЇїЄєҐґ]/;

export function typo(s: string, prev = ""): string {
  for (const [from, to] of FIXES) s = s.replace(from, to);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const before = i ? s[i - 1] : prev.slice(-1);
    const after = s[i + 1] ?? "";
    if (c === '"') out += !before || OPENS.test(before) ? "«" : "»";
    else if (c === "“" || c === "„") out += "«";
    else if (c === "”") out += "»";
    else if ((c === "'" || c === "ʼ" || c === "`") && LETTER.test(before) && LETTER.test(after)) out += "’";
    else out += c;
  }
  return out
    .replace(/\.{3}/g, "…")
    .replace(/ [-–] /g, " — ")
    .replace(/ — /g, " — ")
    // a one- or two-letter word stays with the word after it
    .replace(/(^|[\s(« ])([A-Za-zА-Яа-яІіЇїЄєҐґ]{1,2}) (?=[^\s])/g, "$1$2 ")
    .replace(/(^|[\s(« ])([A-Za-zА-Яа-яІіЇїЄєҐґ]{1,2}) (?=[^\s])/g, "$1$2 ");
}
