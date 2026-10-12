import type { Block, Line } from "./journal";

/** What a Telegram post is made of, read from how it was written. The posts
 * carry no markup beyond bold and links, so structure is inferred: a short
 * bold line or a line ending in a colon is a heading, «1. …» paragraphs are
 * a list, a line in «…» is a spoken formula, «Term — text» lines in a row
 * are a glossary, and short lines in a row are verse. */
export type Node =
  | { kind: "lede"; lines: Line[] }
  | { kind: "h"; text: string }
  | { kind: "p"; lines: Line[] }
  | { kind: "verse"; lines: Line[] }
  | { kind: "quote"; lines: Line[] }
  | { kind: "ol"; items: Line[][] }
  | { kind: "ul"; items: Line[][] }
  | { kind: "terms"; items: { term: Line; note: Line[] }[] };

const text = (l: Line) => l.map((r) => r.t).join("").replace(/\s+/g, " ").trim();
const blockText = (b: Block) => b.map(text).join(" ");
const allBold = (l: Line) => l.length > 0 && l.every((r) => r.b);
const NUM = /^\s*(\d{1,2})[.)]\s+/;
const DASH = /^\s*[—–\-•]\s+/;
const ARROW = /^\s*[→➜➔>]+\s*/;
const TERM = /^[A-ZА-ЯІЇЄҐ][^.!?—:]{1,30}\s—\s/;

/** the same line without its marker, formatting kept */
function unmark(line: Line, re: RegExp): Line {
  const out = line.map((r) => ({ ...r }));
  if (out[0]) out[0].t = out[0].t.replace(re, "");
  return out.filter((r) => r.t);
}

/** a line cut at its first « — »: the term before it, the text after */
function splitTerm(line: Line): { term: Line; note: Line } | null {
  const raw = line.map((r) => r.t).join("");
  const at = raw.indexOf(" — ");
  if (at < 0 || !TERM.test(raw.trim())) return null;
  const term: Line = [];
  const note: Line = [];
  let pos = 0;
  for (const r of line) {
    const end = pos + r.t.length;
    if (end <= at) term.push(r);
    else if (pos >= at + 3) note.push(r);
    else {
      if (at > pos) term.push({ ...r, t: r.t.slice(0, at - pos) });
      const rest = r.t.slice(Math.max(0, at + 3 - pos));
      if (rest) note.push({ ...r, t: rest });
    }
    pos = end;
  }
  return term.length && note.length ? { term, note } : null;
}

/** how many leading lines of a block are one heading: one or two lines with
 * no closing punctuation, short together, before a longer line of text */
function headLines(b: Block): number {
  for (let k = 1; k <= 2 && k < b.length; k++) {
    const head = b.slice(0, k).map(text);
    const total = head.join(" ").length;
    const open = head.slice(0, -1).every((h) => !/[.!?…:;»”"]$/.test(h));
    const endsOpen = !/[.!?…;»”"]$/.test(head[k - 1]);
    if (total >= 48 && total <= 90 && !head.some((h) => /—|→/.test(h)) && open && endsOpen && text(b[k]).length > total * 0.9 && /^[A-ZА-ЯІЇЄҐ«]/.test(head[0])) return k;
  }
  return 0;
}

export function layout(blocks: Block[]): Node[] {
  const nodes: Node[] = [];
  const termBlock = (b: Block) => b.every((l) => TERM.test(text(l)));

  for (let i = 0; i < blocks.length; i++) {
    let b = blocks[i];

    // a label opening the block: «Підготовка» in bold, or «Як виконати:» ending in a colon
    if (b.length > 1) {
      const first = text(b[0]);
      const rest = b.slice(1);
      const colon = /[^.!?…]:\s*$/.test(first);
      if (first.length <= 60 && allBold(b[0]) && !NUM.test(first)) {
        nodes.push({ kind: "h", text: first.replace(/[:：]\s*$/, "") });
        b = rest;
      } else if (first.length <= 60 && colon && /^[A-ZА-ЯІЇЄҐ«]/.test(first)) {
        nodes.push({ kind: "h", text: first.replace(/[:：]\s*$/, "") });
        b = rest;
      } else if (headLines(b) > 0) {
        // a heading the channel wrapped over two lines, then the text
        const k = headLines(b);
        nodes.push({ kind: "h", text: b.slice(0, k).map(text).join(" ").replace(/[:：]\s*$/, "") });
        b = b.slice(k);
      } else if (colon && rest.every((l) => DASH.test(text(l)) || NUM.test(text(l)))) {
        // «а, можливо:» leads into its list and stays a line of the text
        nodes.push({ kind: "p", lines: [b[0]] });
        b = rest;
      }
    }
    const t = blockText(b);

    // numbered lines: each numbered line opens an item, lines after it belong to it
    const numbered = b.filter((l) => NUM.test(text(l))).length;
    if (numbered >= 2 && NUM.test(text(b[0]))) {
      const items: Line[][] = [];
      for (const l of b) {
        if (NUM.test(text(l))) items.push([unmark(l, NUM)]);
        else items[items.length - 1].push(l);
      }
      nodes.push({ kind: "ol", items });
      continue;
    }
    // «1. …» paragraphs in a row
    if (NUM.test(text(b[0]))) {
      const items: Line[][] = [];
      let j = i;
      while (j < blocks.length && NUM.test(text(blocks[j][0]))) {
        items.push([unmark(blocks[j][0], NUM), ...blocks[j].slice(1)]);
        j++;
      }
      if (items.length >= 2) {
        nodes.push({ kind: "ol", items });
        i = j - 1;
        continue;
      }
    }
    // dash lines
    if (b.length >= 2 && b.every((l) => DASH.test(text(l)))) {
      nodes.push({ kind: "ul", items: b.map((l) => [unmark(l, DASH)]) });
      continue;
    }
    // «Term» then «→ meaning» on the next line
    if (b.length >= 2 && b.some((l) => ARROW.test(text(l)) && text(l).length > 2)) {
      const items: { term: Line; note: Line[] }[] = [];
      for (const l of b) {
        if (ARROW.test(text(l)) && items.length) items[items.length - 1].note.push(unmark(l, ARROW));
        else items.push({ term: l, note: [] });
      }
      nodes.push({ kind: "terms", items });
      continue;
    }
    // a short bold line on its own, or a short line ending in a colon before more text
    if (b.length === 1 && t.length <= 80) {
      if (allBold(b[0]) && !NUM.test(t)) {
        nodes.push({ kind: "h", text: t.replace(/[:：]\s*$/, "") });
        continue;
      }
      if (/[^.!?…]:\s*$/.test(t) && /^[A-ZА-ЯІЇЄҐ«]/.test(t) && i > 0 && i < blocks.length - 1) {
        nodes.push({ kind: "h", text: t.replace(/:\s*$/, "") });
        continue;
      }
    }
    // «Term — text» paragraphs in a row: a glossary
    if (termBlock(b)) {
      let j = i;
      const items: { term: Line; note: Line[] }[] = [];
      while (j < blocks.length && termBlock(blocks[j])) {
        const parts = blocks[j].map(splitTerm);
        if (parts.some((x) => !x)) break;
        for (const x of parts) items.push({ term: x!.term, note: [x!.note] });
        j++;
      }
      if (items.length >= 3) {
        nodes.push({ kind: "terms", items });
        i = j - 1;
        continue;
      }
    }
    // a spoken formula: wrapped in «…»
    if (/^[«"“]/.test(t) && /[»”"][.!]?$/.test(t) && t.length < 420) {
      nodes.push({ kind: "quote", lines: b });
      continue;
    }
    // short lines in a row are verse
    const avg = b.reduce((n, l) => n + text(l).length, 0) / b.length;
    if (b.length >= 3 && avg < 46) {
      nodes.push({ kind: "verse", lines: b });
      continue;
    }
    nodes.push({ kind: "p", lines: b });
  }

  // the first paragraph leads when it opens the text and is prose of a sensible length
  const n0 = nodes[0];
  if (n0 && n0.kind === "p") {
    const len = n0.lines.map(text).join(" ").length;
    if (len >= 40 && len <= 420) nodes[0] = { kind: "lede", lines: n0.lines };
  }
  return nodes;
}
