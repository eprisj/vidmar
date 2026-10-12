// Fetches the journal's reading list (scripts/journal-picks.json) from the
// public pages of the founder's Telegram channels and writes the result the
// site is built from: lib/journal-data.json, with the posts' pictures saved
// to public/journal/. The output is committed and the build never runs this,
// so a deploy does not depend on Telegram answering. To change what stands in
// the journal edit the picks file and run:
//   npm run journal
// To see what the channels have posted that is not in the journal yet:
//   npm run journal -- --new

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const picks = JSON.parse(readFileSync(new URL("scripts/journal-picks.json", ROOT), "utf8")).picks;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ENT = { "&quot;": '"', "&#39;": "'", "&#039;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&amp;": "&" };
const unescapeHtml = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(quot|lt|gt|nbsp|amp);|&#0?39;/g, (m) => ENT[m] ?? m);

// emoji are pictures in Telegram and have no place in the engraved face
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}\u{1F3FB}-\u{1F3FF}]/gu;

const between = (s, a, b) => {
  const i = s.indexOf(a);
  if (i < 0) return null;
  const j = s.indexOf(b, i + a.length);
  return j < 0 ? null : s.slice(i + a.length, j);
};

/** Telegram's markup to lines of {t, b, i, href} runs: bold, italic and
 * links are kept, everything else is text. */
function toLines(html) {
  const src = html
    .replace(/<i class="emoji"[^>]*>.*?<\/i>/gs, "")
    .replace(/<br\s*\/?>/g, "\n");
  const lines = [[]];
  const st = { b: 0, i: 0, href: [] };
  const push = (text) => {
    const t = unescapeHtml(text).replace(EMOJI, "");
    if (!t) return;
    const parts = t.split("\n");
    parts.forEach((p, k) => {
      if (k > 0) lines.push([]);
      if (!p) return;
      const run = { t: p };
      if (st.b) run.b = true;
      if (st.i) run.i = true;
      if (st.href.length) run.href = st.href[st.href.length - 1];
      lines[lines.length - 1].push(run);
    });
  };
  for (const tok of src.split(/(<[^>]+>)/)) {
    if (!tok) continue;
    if (tok[0] !== "<") { push(tok); continue; }
    const tag = /^<\/?\s*([a-z0-9]+)/i.exec(tok)?.[1]?.toLowerCase();
    const close = tok[1] === "/";
    if (tag === "b" || tag === "strong") st.b += close ? -1 : 1;
    else if (tag === "i" || tag === "em") st.i += close ? -1 : 1;
    else if (tag === "a") {
      if (close) st.href.pop();
      else {
        const h = /href="([^"]+)"/.exec(tok)?.[1];
        st.href.push(h && /^https?:/.test(unescapeHtml(h)) ? unescapeHtml(h) : "");
      }
    }
  }
  // merge neighbouring runs, trim every line
  return lines.map((l) => {
    const out = [];
    for (const r of l) {
      const last = out[out.length - 1];
      if (last && !!last.b === !!r.b && !!last.i === !!r.i && last.href === r.href) last.t += r.t;
      else out.push({ ...r });
    }
    if (out.length) {
      out[0].t = out[0].t.trimStart();
      out[out.length - 1].t = out[out.length - 1].t.trimEnd();
    }
    return out.filter((r) => r.t);
  });
}

const lineText = (l) => l.map((r) => r.t).join("").replace(/\s+/g, " ").trim();
const norm = (s) => s.replace(EMOJI, "").replace(/[“”«»"']/g, "").replace(/\s+/g, " ").trim().toLowerCase();

/** lines to paragraphs: blank lines separate them */
function toBlocks(lines) {
  const blocks = [];
  let cur = [];
  for (const l of lines) {
    if (!l.length) { if (cur.length) blocks.push(cur), (cur = []); }
    else cur.push(l);
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

async function embed(channel, id) {
  const res = await fetch(`https://t.me/${channel}/${id}?embed=1&mode=tme`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${channel}/${id}: HTTP ${res.status}`);
  const html = await res.text();
  const raw = between(html, 'tgme_widget_message_text js-message_text" dir="auto">', "</div>");
  if (raw == null) throw new Error(`${channel}/${id}: no text`);
  const stamp = /<time datetime="([^"]+)"/.exec(html)?.[1];
  const photo = /tgme_widget_message_photo_wrap[^>]*background-image:url\('([^']+)'\)/.exec(html)?.[1];
  const views = between(html, 'tgme_widget_message_views">', "<");
  return { raw, date: stamp, photo, views };
}

async function build(p) {
  const post = await embed(p.channel, p.id);
  let lines = toLines(post.raw);
  // the post's own first line is the title already
  const dropN = new Set((p.dropLines || []).map(norm));
  lines = lines.filter((l) => !dropN.has(norm(lineText(l))));
  let first = lines.findIndex((l) => l.length);
  if (first >= 0 && norm(lineText(lines[first])) === norm(p.title)) lines.splice(first, 1);
  if (p.strip) {
    first = lines.findIndex((l) => l.length);
    const want = norm(p.strip);
    const got = norm(lineText(lines[first]));
    if (got === want) lines.splice(first, 1);
    else if (got.startsWith(want)) {
      // cut the words off the start of the line, keeping the formatting of the rest
      const full = lineText(lines[first]);
      const at = full.toLowerCase().indexOf(p.strip.toLowerCase());
      let n = at < 0 ? 0 : at + p.strip.length;
      lines[first] = lines[first]
        .map((r) => { const take = Math.min(n, r.t.length); n -= take; return { ...r, t: r.t.slice(take) }; })
        .filter((r) => r.t);
      if (lines[first][0]) lines[first][0].t = lines[first][0].t.trimStart();
    } else throw new Error(`${p.slug}: "strip" did not match the start of the post`);
  }
  let blocks = toBlocks(lines);
  if (p.cut) {
    const k = blocks.findIndex((b) => lineText(b[0]).startsWith(p.cut));
    if (k < 0) throw new Error(`${p.slug}: "cut" not found`);
    blocks = blocks.slice(0, k);
  }
  // a block of dashes or ⸻ is a rule, not a paragraph
  blocks = blocks.filter((b) => !(b.length === 1 && /^[⸻—–\-_* ]{1,6}$/.test(lineText(b[0]))));
  const text = blocks.map((b) => b.map(lineText).join(" ")).join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  let image = null;
  if (post.photo) {
    const file = `${p.slug}.jpg`;
    const r = await fetch(post.photo, { headers: { "User-Agent": UA } });
    if (r.ok) {
      mkdirSync(new URL("public/journal/", ROOT), { recursive: true });
      writeFileSync(new URL(`public/journal/${file}`, ROOT), Buffer.from(await r.arrayBuffer()));
      image = `/journal/${file}`;
    }
  }
  const dek =
    p.dek ||
    (() => {
      const f = lineText(blocks[0]?.[0] ?? []);
      const s = f.length > 190 ? f.slice(0, f.lastIndexOf(" ", 180)) + "…" : f;
      return s;
    })();
  return {
    slug: p.slug,
    rubric: p.rubric,
    title: p.title,
    dek,
    date: post.date,
    channel: p.channel,
    post: p.id,
    url: `https://t.me/${p.channel}/${p.id}`,
    image,
    minutes: Math.max(1, Math.round(words / 190)),
    blocks,
  };
}

if (process.argv.includes("--new")) {
  // what the channels posted lately that the list does not have: long posts only
  const have = new Set(picks.map((p) => `${p.channel}/${p.id}`));
  for (const channel of ["lunnaria_academy", "yarlinscky"]) {
    const html = await (await fetch(`https://t.me/s/${channel}`, { headers: { "User-Agent": UA } })).text();
    for (const chunk of html.split(`data-post="${channel}/`).slice(1)) {
      const id = parseInt(chunk, 10);
      const raw = between(chunk, 'tgme_widget_message_text js-message_text" dir="auto">', "</div>") ?? "";
      const text = toLines(raw).map(lineText).join("\n").trim();
      if (text.length >= (channel === "yarlinscky" ? 900 : 450) && !have.has(`${channel}/${id}`))
        console.log(`${channel}/${id}  ${text.length} знаків  ${text.split("\n")[0].slice(0, 80)}`);
    }
  }
  process.exit(0);
}

const out = [];
for (const p of picks) {
  out.push(await build(p));
  process.stdout.write(`${p.channel}/${p.id} → ${p.slug}\n`);
  await sleep(500);
}
// newest first within the list; the page groups them by rubric
out.sort((a, b) => (a.date < b.date ? 1 : -1));
writeFileSync(new URL("lib/journal-data.json", ROOT), JSON.stringify(out, null, 1) + "\n");
console.log(`\n${out.length} записів → lib/journal-data.json`);
