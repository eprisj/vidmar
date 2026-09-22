// Grows the boutique-shelf engraving into a static SVG: the same tool as
// forest.mjs, pointed at a different scene. Seeded, so re-running it gives
// the same shelf; the output is committed and the build never runs this.
// Change a seed or a shelf list and run:
//   npm run shelf

import { mkdirSync, writeFileSync } from "node:fs";

const W = 1600;
const H = 900;
const OUT = new URL("../assets/shelf/", import.meta.url);

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r = (n) => Math.round(n);
const INK = "#0e1d3a";
const PAPER = "#f5deb3";
const GOLD = "#c9a961";

/* ---------- the wall: ruled like the sky, lit from one lamp ---------- */
/* Same burin-ruling as the forest's sky, but the light comes from a single
   warm point off to the side — a reading lamp, not a moon overhead — so the
   two scenes read as one house's hand without repeating each other. */

const STEP = 4;
const LAMP = { x: 1220, y: 250 };

function light(x, y) {
  const d = Math.hypot(x - LAMP.x, y - LAMP.y);
  const base = 0.05 + 0.05 * (y / H);
  const glow = 0.66 * Math.exp(-((d / 230) ** 2)) + 0.14 * Math.exp(-((d / 520) ** 2));
  return Math.min(1, base + glow);
}

/** Ramer–Douglas–Peucker: drop points the edge would pass within tol of
 * anyway — keeps a ruled row a size the page can carry. */
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
  const rng = mulberry32(11);
  const rows = [];
  for (let y0 = STEP / 2; y0 < H; y0 += STEP) {
    const phase = rng() * Math.PI * 2;
    const top = [];
    const bot = [];
    for (let x = -8; x <= W + 8; x += 4) {
      const y = y0 + 0.5 * Math.sin(x / 320 + phase);
      const w = Math.max(0.16, light(x, y) * STEP * 1.02);
      top.push([x, y - w / 2]);
      bot.push([x, y + w / 2]);
    }
    const edge = [...simplify(top, 0.06), ...simplify(bot, 0.06).reverse()];
    rows.push("M" + edge.map(([x, y]) => `${x} ${y.toFixed(1)}`).join("L") + "Z");
  }
  return `<rect width="${W}" height="${H}" fill="${INK}"/><path fill="${PAPER}" d="${rows.join("")}"/>`;
}

/* ---------- the shelves ---------- */

/** One board, its own slight sag from the weight on it. */
function board(rng, y, amp) {
  let d = `M0 ${r(y - 10)}`;
  for (let x = 0; x <= W; x += 100) d += `L${x} ${r(y - 10 + (rng() - 0.5) * amp)}`;
  for (let x = W; x >= 0; x -= 100) d += `L${x} ${r(y + 14 + (rng() - 0.5) * amp)}`;
  return `${d}Z`;
}

/** One book: a leaning rectangle with a spine tick or two — gilt lines
 * caught by the lamp, the one warm accent besides the flame itself. */
function book(rng, x, base, h) {
  const w = 16 + rng() * 26;
  const lean = (rng() - 0.5) * 10;
  const gilt = rng() < 0.45;
  const g = gilt
    ? `<line x1="${r(x + w * 0.22)}" y1="${r(base - h * 0.32)}" x2="${r(x + w * 0.78)}" y2="${r(base - h * 0.32)}" stroke="${GOLD}" stroke-width="1.6" opacity="${(0.35 + rng() * 0.35).toFixed(2)}"/>`
    : "";
  return {
    w,
    svg: `<g transform="rotate(${lean.toFixed(1)} ${r(x + w / 2)} ${r(base)})"><rect x="${r(x)}" y="${r(base - h)}" width="${r(w)}" height="${r(h)}" rx="1.5"/></g>${g}`,
  };
}

/** A run of books along one shelf, packed left to right with the odd gap
 * and one toppled spine — a curated shelf, not a filed one. */
function row(rng, y, count, hRange) {
  const parts = [];
  let x = 46 + rng() * 30;
  for (let i = 0; i < count && x < W - 60; i++) {
    if (rng() < 0.06) {
      x += 22 + rng() * 20; // a gap, the way a shelf never fills edge to edge
      continue;
    }
    const h = hRange[0] + rng() * (hRange[1] - hRange[0]);
    const { w, svg } = book(rng, x, y, h);
    parts.push(svg);
    x += w + 1.5 + rng() * 2.5;
  }
  return parts.join("");
}

/** A trail of leaves off the top shelf's end — the boutique's one plant,
 * grown with the same wandering bezier the forest's limbs use. */
function vine(rng, x0, y0) {
  let x = x0;
  let y = y0;
  let ang = Math.PI * 0.62;
  const leaves = [];
  const stem = [`M${r(x)} ${r(y)}`];
  for (let i = 0; i < 9; i++) {
    ang += (rng() - 0.5) * 0.9;
    const len = 26 + rng() * 16;
    const nx = x + Math.cos(ang) * len;
    const ny = y - Math.abs(Math.sin(ang)) * len * 0.7;
    const cx = (x + nx) / 2 + (rng() - 0.5) * 14;
    const cy = (y + ny) / 2 - rng() * 10;
    stem.push(`Q${r(cx)} ${r(cy)} ${r(nx)} ${r(ny)}`);
    if (i % 2 === 0) {
      const s = 7 + rng() * 6;
      leaves.push(
        `<ellipse cx="${r(nx)}" cy="${r(ny)}" rx="${s}" ry="${s * 0.55}" transform="rotate(${r((ang * 180) / Math.PI)} ${r(nx)} ${r(ny)})"/>`,
      );
    }
    x = nx;
    y = ny;
  }
  return `<path d="${stem.join("")}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><g fill="${INK}">${leaves.join("")}</g>`;
}

const rng = mulberry32(58);

const shelves = [
  { y: 300, amp: 4, count: 30, h: [86, 128] },
  { y: 520, amp: 5, count: 34, h: [92, 140] },
  { y: 748, amp: 6, count: 30, h: [96, 150] },
];

const parts = [wall()];

// the frame's uprights — two posts the shelves are let into
parts.push(
  `<g fill="${INK}"><path d="M18 120L58 120L52 820L24 820Z"/><path d="M${W - 58} 120L${W - 18} 120L${W - 24} 820L${W - 52} 820Z"/></g>`,
);

for (const s of shelves) {
  parts.push(`<path d="${board(rng, s.y, s.amp)}" fill="${INK}"/>`);
  parts.push(`<g fill="${INK}">${row(rng, s.y - 12, s.count, s.h)}</g>`);
}

// the plant, trailing off the top shelf near the lamp
parts.push(vine(rng, 1120, 278));

// the lamp: a small brass fitting and its flame, the only warm fill
parts.push(
  `<g><path d="M${LAMP.x - 10} ${LAMP.y + 26}L${LAMP.x + 10} ${LAMP.y + 26}L${LAMP.x + 6} ${LAMP.y + 6}L${LAMP.x - 6} ${LAMP.y + 6}Z" fill="${INK}"/><ellipse cx="${LAMP.x}" cy="${LAMP.y}" rx="9" ry="13" fill="${PAPER}"/><ellipse cx="${LAMP.x}" cy="${LAMP.y + 2}" rx="4.5" ry="7" fill="${GOLD}"/></g>`,
);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${parts.join("")}</svg>`;

mkdirSync(OUT, { recursive: true });
writeFileSync(new URL("shelf.svg", OUT), svg);
console.log(`shelf.svg  ${(svg.length / 1024).toFixed(1)} KB`);
