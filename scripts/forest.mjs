// Grows the three planes of the home page's night forest into static SVGs.
// Seeded, so re-running it gives the same trees; the output is committed and
// the build never runs this. Change a seed or a tree list and run:
//   npm run forest

import { mkdirSync, writeFileSync } from "node:fs";

const W = 1600;
const H = 900;
const OUT = new URL("../assets/forest/", import.meta.url);

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

/** A bare, crooked tree: a wandering trunk that forks into bent limbs.
 * Limbs are bucketed by stroke width, which tapers per limb rather than per
 * depth — a width that dropped by a fixed step at every joint made the old
 * trunks look jointed, like stacked pipe. */
function tree(
  rng,
  { x, ground, height, depth, w0, lean = 0, spread = 0.95, trunkRun = 1 },
) {
  const byWidth = new Map();

  function grow(x1, y1, ang, len, d, w) {
    const x2 = x1 + Math.cos(ang) * len;
    const y2 = y1 + Math.sin(ang) * len;

    // bend every limb off its straight line — the crookedness is the point
    const off = (rng() - 0.5) * len * 0.42;
    const cx = (x1 + x2) / 2 + Math.cos(ang + Math.PI / 2) * off;
    const cy = (y1 + y2) / 2 + Math.sin(ang + Math.PI / 2) * off;
    const key = Math.max(0.7, Math.round(w * 2) / 2);
    if (!byWidth.has(key)) byWidth.set(key, []);
    byWidth.get(key).push(`M${r(x1)} ${r(y1)}Q${r(cx)} ${r(cy)} ${r(x2)} ${r(y2)}`);

    if (d >= depth || len < 5) return;

    // the trunk wanders upward alone for trunkRun limbs before it forks
    const n = d < trunkRun ? 1 : rng() < 0.3 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      if (d > 3 && rng() < 0.13) continue; // a dead limb here and there
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const a =
        ang + t * spread + (rng() - 0.5) * (n === 1 ? 0.35 : 0.6) + lean * 0.05;
      const l = len * (n === 1 ? 0.86 + rng() * 0.1 : 0.62 + rng() * 0.17);
      grow(x2, y2, a, l, d + 1, w * (n === 1 ? 0.84 : 0.66));
    }
  }

  grow(x, ground + 6, -Math.PI / 2 + lean * 0.12, height * 0.3, 0, w0);
  return byWidth;
}

/** Low rolling ground so the trunks stand on something. */
function ground(rng, y, amp) {
  let d = `M0 ${H}L0 ${r(y)}`;
  for (let x = 0; x <= W; x += 80) {
    d += `L${x} ${r(y + (rng() - 0.5) * amp)}`;
  }
  return `${d}L${W} ${H}Z`;
}

const INK = "#0a0a0a";
const PAPER = "#e9e1cc";

/* ---------- the engraved sky ---------- */

/* The sky is ruled like a line engraving: one horizontal line every STEP
   units, each swelling where the light is stronger until, on the moon, the
   lines close into a solid disc. Tone comes from line weight alone — the
   way an etcher renders it — rather than from gradients, which is what made
   the flat version read as clip art.

   The sky and moon ride in the far plane rather than in CSS: all three
   planes share one viewBox and one crop, so the front branches cross the
   moon in the same place on every screen shape. */

const STEP = 4;
const MOON = { x: 800, y: 228, r: 108 };
// faint maria: thinner lines inside the disc
const MARIA = [
  [-28, -24, 30],
  [24, 20, 22],
  [-12, 36, 12],
];

function light(x, y) {
  const d = Math.hypot(x - MOON.x, y - MOON.y);
  if (d < MOON.r) {
    const inMare = MARIA.some(
      ([dx, dy, rr]) => Math.hypot(x - MOON.x - dx, y - MOON.y - dy) < rr,
    );
    return inMare ? 0.7 : 1;
  }
  const base = 0.035 + 0.07 * (y / H) ** 1.6;
  const glow = 0.62 * Math.exp(-((d / 190) ** 2)) + 0.16 * Math.exp(-((d / 430) ** 2));
  const mist = 0.13 * Math.exp(-(((y - 700) / 90) ** 2)) * (0.8 + 0.2 * Math.sin(x / 420));
  return Math.min(1, base + glow + mist);
}

/** Ramer–Douglas–Peucker: drop points the edge would pass within tol of
 * anyway. Most of a ruled line barely changes weight, so this is what takes
 * the sky from over a megabyte to a size a page can carry. */
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

function engraving() {
  const rng = mulberry32(99);
  const rows = [];
  for (let y0 = STEP / 2; y0 < H; y0 += STEP) {
    // a burin never runs perfectly straight
    const phase = rng() * Math.PI * 2;
    const top = [];
    const bot = [];
    for (let x = -8; x <= W + 8; x += 4) {
      const y = y0 + 0.6 * Math.sin(x / 300 + phase);
      const w = Math.max(0.18, light(x, y) * STEP * 1.04);
      top.push([x, y - w / 2]);
      bot.push([x, y + w / 2]);
    }
    const edge = [...simplify(top, 0.06), ...simplify(bot, 0.06).reverse()];
    rows.push("M" + edge.map(([x, y]) => `${x} ${y.toFixed(1)}`).join("L") + "Z");
  }
  return `<rect width="${W}" height="${H}" fill="${INK}"/><path fill="${PAPER}" d="${rows.join("")}"/>`;
}

function plane({ seed, groundY, groundAmp, trunk, trunkRun, trees, sky, opacity = 1 }) {
  const color = INK;
  const rng = mulberry32(seed);
  const paths = [`<path d="${ground(rng, groundY, groundAmp)}" fill="${color}"/>`];

  for (const spec of trees) {
    // a little lean of its own, so no two trees stand the same way
    const lean =
      spec.lean === undefined
        ? (rng() - 0.5) * 1.2
        : spec.lean + (rng() - 0.5) * 0.6;
    const byWidth = tree(rng, {
      ...spec,
      lean,
      ground: groundY,
      w0: spec.height * trunk,
      trunkRun,
    });
    for (const [w, segs] of byWidth) {
      paths.push(`<path d="${segs.join("")}" stroke-width="${w}"/>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">${sky ? engraving() : ""}<g fill="none" stroke="${color}" stroke-linecap="round"${opacity < 1 ? ` opacity="${opacity}"` : ""}>${paths.join("")}</g></svg>`;
}

// far: small, many, pale with distance — they stand in the ruled mist
const back = plane({
  seed: 7,
  sky: true,
  // the far trees are inked lighter, so the ruled mist shows through them
  opacity: 0.55,
  groundY: 800,
  groundAmp: 22,
  trunk: 0.03,
  trunkRun: 1,
  trees: [
    { x: 60, height: 300, depth: 5 },
    { x: 210, height: 250, depth: 5 },
    { x: 350, height: 330, depth: 5 },
    { x: 500, height: 270, depth: 5 },
    { x: 640, height: 360, depth: 5 },
    { x: 760, height: 290, depth: 5 },
    { x: 880, height: 340, depth: 5 },
    { x: 1010, height: 260, depth: 5 },
    { x: 1150, height: 350, depth: 5 },
    { x: 1290, height: 280, depth: 5 },
    { x: 1430, height: 320, depth: 5 },
    { x: 1560, height: 260, depth: 5 },
  ],
});

// middle: fewer, taller, kept thin toward the centre so the name reads
const mid = plane({
  seed: 21,
  groundY: 842,
  groundAmp: 26,
  trunk: 0.034,
  trunkRun: 1,
  trees: [
    { x: 110, height: 520, depth: 6, lean: 1 },
    { x: 330, height: 440, depth: 6 },
    { x: 560, height: 380, depth: 6 },
    { x: 1060, height: 400, depth: 6 },
    { x: 1270, height: 470, depth: 6 },
    { x: 1480, height: 540, depth: 6, lean: -1 },
  ],
});

// near: four old trees at the edges, leaning in to frame the clearing
const front = plane({
  seed: 43,
  groundY: 884,
  groundAmp: 14,
  trunk: 0.04,
  trunkRun: 2,
  trees: [
    { x: -30, height: 860, depth: 8, lean: 3, spread: 1.05 },
    { x: 190, height: 620, depth: 8, lean: 2 },
    { x: 1410, height: 650, depth: 8, lean: -2 },
    { x: 1640, height: 880, depth: 8, lean: -3, spread: 1.05 },
  ],
});

mkdirSync(OUT, { recursive: true });
for (const [name, svg] of Object.entries({ back, mid, front })) {
  writeFileSync(new URL(`${name}.svg`, OUT), svg);
  console.log(`${name}.svg  ${(svg.length / 1024).toFixed(1)} KB`);
}
