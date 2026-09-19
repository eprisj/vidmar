// Grows the ritual-altar engraving into a static SVG: same tool as
// forest.mjs and shelf.mjs, a third scene. Seeded, so re-running it gives
// the same altar; the output is committed and the build never runs this.
//   npm run altar

import { mkdirSync, writeFileSync } from "node:fs";

const W = 1600;
const H = 900;
const OUT = new URL("../assets/altar/", import.meta.url);

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r = (n) => Math.round(n * 10) / 10;
const INK = "#0a0a0a";
const PAPER = "#e9e1cc";
const GOLD = "#c9a24b";

/* ---------- the wall: ruled like the sky, lit by three candles ---------- */

const STEP = 4;
const FLAMES = [
  { x: 500, y: 430, s: 1 },
  { x: 800, y: 380, s: 0.75 },
  { x: 1080, y: 430, s: 1 },
];

function light(x, y) {
  let glow = 0;
  for (const f of FLAMES) {
    const d = Math.hypot(x - f.x, y - f.y);
    glow += f.s * (0.72 * Math.exp(-((d / 150) ** 2)) + 0.16 * Math.exp(-((d / 380) ** 2)));
  }
  const base = 0.045 + 0.05 * (y / H);
  return Math.min(1, base + glow);
}

function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0];
  const [bx, by] = pts[pts.length - 1];
  const len = Math.hypot(bx - ax, by - ay) || 1;
  let far = 0;
  let at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    const dist = Math.abs((by - ay) * px - (bx - ax) * py + bx * ay - by * ax) / len;
    if (dist > far) {
      far = dist;
      at = i;
    }
  }
  if (far <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, at + 1), tol).slice(0, -1), ...simplify(pts.slice(at), tol)];
}

function wall() {
  const rng = mulberry32(4);
  const rows = [];
  for (let y0 = STEP / 2; y0 < H; y0 += STEP) {
    const phase = rng() * Math.PI * 2;
    const top = [];
    const bot = [];
    for (let x = -8; x <= W + 8; x += 4) {
      const y = y0 + 0.5 * Math.sin(x / 300 + phase);
      const w = Math.max(0.16, light(x, y) * STEP * 1.02);
      top.push([x, y - w / 2]);
      bot.push([x, y + w / 2]);
    }
    const edge = [...simplify(top, 0.06), ...simplify(bot, 0.06).reverse()];
    rows.push("M" + edge.map(([x, y]) => `${x} ${y.toFixed(1)}`).join("L") + "Z");
  }
  return `<rect width="${W}" height="${H}" fill="${INK}"/><path fill="${PAPER}" d="${rows.join("")}"/>`;
}

/* ---------- the table and what stands on it ---------- */

function table(rng) {
  const y = 620;
  let top = `M0 ${y}`;
  for (let x = 0; x <= W; x += 90) top += `L${x} ${r(y + (rng() - 0.5) * 6)}`;
  top += `L${W} ${H}L0 ${H}Z`;
  // a grain of long uneven boards, cut by the ruled light same as the wall
  const boards = [];
  for (let x = -40; x < W; x += 210 + rng() * 60) {
    boards.push(`M${r(x)} ${y + 4}L${r(x)} ${H}`);
  }
  return `<path d="${top}" fill="${INK}"/><path d="${boards.join("")}" stroke="${PAPER}" stroke-width="1" opacity="0.08" fill="none"/>`;
}

function candle(x, baseY, height, flicker) {
  const w = 13;
  const body = `M${x - w / 2} ${baseY}L${x - w / 2} ${baseY - height}Q${x} ${baseY - height - 8} ${x + w / 2} ${baseY - height}L${x + w / 2} ${baseY}Z`;
  const drip = `M${x - w / 2 - 2} ${baseY - height * 0.4}q-3 10 0 18`;
  const wick = `M${x} ${baseY - height}L${x} ${baseY - height - 9}`;
  const flame = `M${x} ${baseY - height - 9}C${x - 7 * flicker} ${baseY - height - 20} ${x + 6} ${baseY - height - 34} ${x} ${baseY - height - 44}C${x - 6} ${baseY - height - 34} ${x + 7 * flicker} ${baseY - height - 20} ${x} ${baseY - height - 9}Z`;
  return `<path d="${body}" fill="${INK}"/><path d="${drip}" fill="none" stroke="${INK}" stroke-width="2" opacity="0.6"/><path d="${wick}" stroke="${INK}" stroke-width="2"/><path d="${flame}" fill="${PAPER}"/><path d="${flame}" fill="${GOLD}" opacity="0.55"/>`;
}

/** The grimoire, open, propped at a lectern angle so both pages and their
 * stacked leaves show, its pages catching the light between the candles. */
function book() {
  const cx = 800;
  const sx = cx; // spine x
  const sy = 560; // spine top
  const sb = 612; // spine bottom (where the gutter meets the table edge)
  const w = 168; // how far each page reaches from the spine
  const droop = 34; // how much lower the outer corner sits than the spine
  // each page is a plain quadrilateral — spine-top, spine-bottom, outer-
  // bottom, outer-top — the shape actually reads as a flat page this way,
  // where the bezier version drew a crescent instead of a book
  const left = `M${sx} ${sy}L${sx} ${sb}L${sx - w} ${sb + droop}L${sx - w + 10} ${sy + droop - 8}Z`;
  const right = `M${sx} ${sy}L${sx} ${sb}L${sx + w} ${sb + droop}L${sx + w - 10} ${sy + droop - 8}Z`;
  // the leaf edge under each page — the block of paper a closed book shows
  const block = `M${sx - w} ${sb + droop}L${sx - w} ${sb + droop + 10}L${sx} ${sb + 10}L${sx + w} ${sb + droop + 10}L${sx + w} ${sb + droop}`;
  const lines = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const ly0 = sy + t * (sb - sy);
    const ly1 = sy + droop - 8 + t * (sb + droop - (sy + droop - 8));
    lines.push(`M${sx - w + 14} ${r(ly1)}L${sx - 14} ${r(ly0)}`);
    lines.push(`M${sx + 14} ${r(ly0)}L${sx + w - 14} ${r(ly1)}`);
  }
  // a small heptagram drawn on the open page, the house's own mark
  const star = starPath(sx, (sy + sb) / 2, 24);
  return (
    `<path d="${block}" fill="${INK}" stroke="${INK}" stroke-width="1"/>` +
    `<path d="${left}" fill="${PAPER}" stroke="${INK}" stroke-width="1.6"/>` +
    `<path d="${right}" fill="${PAPER}" stroke="${INK}" stroke-width="1.6"/>` +
    `<path d="${lines.join("")}" stroke="${INK}" stroke-width="1" opacity="0.4" fill="none"/>` +
    `<path d="${star}" fill="none" stroke="${INK}" stroke-width="1.3" opacity="0.75"/>` +
    `<path d="M${sx} ${sy}L${sx} ${sb}" stroke="${INK}" stroke-width="2.4"/>`
  );
}

function starPath(cx, cy, radius) {
  const pts = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
  });
  return (
    Array.from({ length: 7 }, (_, i) => pts[(i * 3) % 7])
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${r(x)} ${r(y)}`)
      .join(" ") + "Z"
  );
}

/** One card, face down, its back a plain rule and a small star — a fan of
 * five, the way a reading is actually laid. */
function cards(rng) {
  const cx = 1220;
  const y0 = 630;
  const out = [];
  for (let i = 0; i < 5; i++) {
    const t = i - 2;
    const rot = t * 11;
    const dx = t * 34;
    const w = 62;
    const h = 96;
    const x = cx + dx;
    const y = y0 - Math.abs(t) * 6;
    out.push(
      `<g transform="rotate(${r(rot)} ${r(x)} ${r(y)})">` +
        `<rect x="${r(x - w / 2)}" y="${r(y - h)}" width="${w}" height="${h}" rx="4" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>` +
        `<rect x="${r(x - w / 2 + 6)}" y="${r(y - h + 6)}" width="${w - 12}" height="${h - 12}" rx="2" fill="none" stroke="${INK}" stroke-width="1" opacity="0.5"/>` +
        `<path d="${starPath(x, y - h / 2, 12)}" fill="none" stroke="${INK}" stroke-width="1" opacity="0.6"/>` +
        `</g>`,
    );
  }
  return out.join("");
}

/** A rough-cut crystal point, propped beside the book. */
function crystal() {
  const x = 390;
  const y = 616;
  const path = `M${x} ${y - 92}L${x + 16} ${y - 58}L${x + 22} ${y - 10}L${x - 4} ${y}L${x - 24} ${y - 12}L${x - 18} ${y - 56}Z`;
  const facets = `M${x} ${y - 92}L${x + 2} ${y - 12}M${x + 16} ${y - 58}L${x - 4} ${y - 40}L${x - 18} ${y - 56}`;
  return `<path d="${path}" fill="${INK}"/><path d="${facets}" stroke="${PAPER}" stroke-width="1" opacity="0.25" fill="none"/>`;
}

/** A bundle of dried herbs, tied, lying near the crystal. */
function herbs(rng) {
  const x = 250;
  const y = 626;
  const stems = [];
  for (let i = 0; i < 7; i++) {
    const a = -1.35 + i * 0.09 + (rng() - 0.5) * 0.05;
    const len = 60 + rng() * 22;
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    stems.push(`M${r(x)} ${r(y)}Q${r(x + Math.cos(a) * len * 0.5 + (rng() - 0.5) * 10)} ${r(y + Math.sin(a) * len * 0.5)} ${r(ex)} ${r(ey)}`);
  }
  const tie = `M${x - 10} ${y + 4}L${x + 10} ${y + 4}L${x + 8} ${y - 8}L${x - 8} ${y - 8}Z`;
  return `<path d="${stems.join("")}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="${tie}" fill="${INK}"/>`;
}

/** A shallow ellipse scored into the table, foreshortened the way a
 * circle drawn on a surface you're looking at from above-and-in-front
 * always is — ties the spread together as one laid-out rite. */
function ritualCircle() {
  const cx = 800;
  const cy = 660;
  const rx = 540;
  const ry = 34;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${PAPER}" stroke-width="1.4" stroke-dasharray="2 7" opacity="0.4"/>`;
}

/** A stick of incense in a small dish, its smoke the one curling line in an
 * otherwise straight-edged scene. */
function incense(rng) {
  const x = 1400;
  const y = 630;
  const dish = `M${x - 16} ${y}q16 8 32 0`;
  const stick = `M${x} ${y}L${x - 3} ${y - 70}`;
  let smoke = `M${x - 3} ${y - 70}`;
  let sx = x - 3;
  let sy = y - 70;
  let drift = 0;
  for (let i = 0; i < 6; i++) {
    drift += (rng() - 0.5) * 22;
    sx += drift * 0.3;
    sy -= 14 + rng() * 6;
    smoke += `Q${r(sx + drift)} ${r(sy + 7)} ${r(sx)} ${r(sy)}`;
  }
  return (
    `<path d="${dish}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>` +
    `<path d="${stick}" stroke="${INK}" stroke-width="2"/>` +
    `<path d="${smoke}" fill="none" stroke="${PAPER}" stroke-width="1.3" opacity="0.4" stroke-linecap="round"/>`
  );
}

/** Drapery in the top corners — the empty ruled wall read as a backdrop
 * with nothing in the room, so the scene gets the same two hand-cut folds
 * the site's Atmosphere tiles use, cut here from cloth instead of stone. */
function drape(rng) {
  function fold(x0, sign) {
    let d = `M${x0} 0`;
    let x = x0;
    for (let y = 0; y <= 340; y += 34) {
      x += sign * (10 + rng() * 16);
      d += `Q${r(x - sign * 6)} ${r(y + 17)} ${r(x)} ${r(y + 34)}`;
    }
    d += `L${x0 - sign * 120} 0Z`;
    return d;
  }
  return (
    `<path d="${fold(0, 1)}" fill="${INK}" opacity="0.9"/>` +
    `<path d="${fold(W, -1)}" fill="${INK}" opacity="0.9"/>`
  );
}

const rng = mulberry32(71);

const parts = [
  wall(),
  drape(rng),
  table(rng),
  ritualCircle(),
  herbs(rng),
  crystal(),
  incense(rng),
  book(),
  cards(rng),
  candle(FLAMES[0].x, 622, 46, 1),
  candle(FLAMES[2].x, 624, 40, 1.15),
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${parts.join("")}</svg>`;

mkdirSync(OUT, { recursive: true });
writeFileSync(new URL("altar.svg", OUT), svg);
console.log(`altar.svg  ${(svg.length / 1024).toFixed(1)} KB`);
