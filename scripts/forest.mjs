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

/** The sky and moon ride in the far plane rather than in CSS: all three
 * planes share one viewBox and one crop, so the front branches cross the moon
 * in the same place on every screen shape. A separately positioned moon
 * would slide out from under the arch as the aspect ratio changed. */
const SKY = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090c12"/><stop offset=".62" stop-color="#141a23"/><stop offset="1" stop-color="#1c2430"/></linearGradient><radialGradient id="halo"><stop offset="0" stop-color="#e9e2cf" stop-opacity=".34"/><stop offset=".42" stop-color="#e9e2cf" stop-opacity=".1"/><stop offset="1" stop-color="#e9e2cf" stop-opacity="0"/></radialGradient><radialGradient id="disc" cx=".42" cy=".4"><stop offset="0" stop-color="#f4efe2"/><stop offset=".8" stop-color="#e4dcc7"/><stop offset="1" stop-color="#cfc6ae"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#sky)"/><circle cx="800" cy="228" r="300" fill="url(#halo)"/><circle cx="800" cy="228" r="108" fill="url(#disc)"/><g fill="#9a917c" opacity=".16"><ellipse cx="770" cy="200" rx="30" ry="22"/><ellipse cx="826" cy="252" rx="22" ry="16"/><ellipse cx="786" cy="266" rx="12" ry="9"/><ellipse cx="838" cy="196" rx="11" ry="8"/></g>`;

function plane({ seed, color, groundY, groundAmp, trunk, trunkRun, trees, sky }) {
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">${sky ? SKY : ""}<g fill="none" stroke="${color}" stroke-linecap="round">${paths.join("")}</g></svg>`;
}

// far: small, many, pale with distance — they sit in the fog
const back = plane({
  seed: 7,
  sky: true,
  color: "#2a3442",
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
  color: "#141a22",
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
  color: "#06080b",
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
