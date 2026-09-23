import styles from "./Seal.module.css";

type Props = {
  /** ticks around the outer ring; a multiple of seven lines the long ones up with the star */
  ticks?: number;
  /** draw the heptagram inside the ring */
  star?: boolean;
  /** star alone at small size: fills the box, hairline stays 1px at any scale */
  emblem?: boolean;
  /** the seven moon phases riding the ring; defaults on for the large rings */
  moons?: boolean;
  className?: string;
};

const round = (n: number) => Number(n.toFixed(3));

/** point on a circle, 0 = top */
function pt(cx: number, cy: number, r: number, i: number, total: number) {
  const a = (i / total) * Math.PI * 2 - Math.PI / 2;
  return { x: round(cx + Math.cos(a) * r), y: round(cy + Math.sin(a) * r) };
}

/** The lit part of a moon at fraction f of its cycle (0 new, 0.5 full):
 * the bright limb as a half circle, closed by the terminator as a half
 * ellipse whose width follows the phase. */
function moonPath(cx: number, cy: number, r: number, f: number) {
  const top = `${round(cx)} ${round(cy - r)}`;
  const bottom = `${round(cx)} ${round(cy + r)}`;
  const rx = round(Math.abs(Math.cos(f * Math.PI * 2)) * r);
  const waxing = f < 0.5;
  const crescent = f < 0.25 || f > 0.75;
  const limb = waxing ? 1 : 0;
  const term = waxing ? (crescent ? 0 : 1) : crescent ? 1 : 0;
  return `M${top} A${r} ${r} 0 0 ${limb} ${bottom} A${rx} ${r} 0 0 ${term} ${top} Z`;
}

/** Clockwise from the top: full, waning through to the thinnest crescent,
 * then waxing back up. Seven, one per point of the star. */
const PHASES = [0.5, 0.625, 0.75, 0.875, 0.125, 0.25, 0.375];

/**
 * The publisher's mark: an astrolabe ring around a heptagram, the
 * seven-pointed witch's star. The long ticks fall on the star's seven
 * points, not on twelve hours: with twelve the ring read as a clock face.
 * On the large rings a moon in each of those seven places runs through its
 * phases, full at the top.
 */
export default function Seal({
  ticks = 84,
  star = true,
  emblem = false,
  moons,
  className = "",
}: Props) {
  const C = 100;
  const showMoons = moons ?? (!emblem && ticks >= 70);

  // {7/3} heptagram: step three vertices at a time around seven points
  const verts = Array.from({ length: 7 }, (_, i) => pt(C, C, emblem ? 88 : 58, i, 7));
  const path =
    Array.from({ length: 7 }, (_, i) => verts[(i * 3) % 7])
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
      .join(" ") + " Z";

  const every = ticks % 7 === 0 ? ticks / 7 : 8;
  const marks = Array.from({ length: ticks }, (_, i) => {
    const major = i % every === 0;
    const half = !major && every % 2 === 0 && i % (every / 2) === 0;
    const outer = pt(C, C, 96, i, ticks);
    const inner = pt(C, C, major ? 87 : half ? 90.5 : 92.5, i, ticks);
    return { i, major, half, outer, inner };
  });

  return (
    <svg
      className={`${styles.seal} ${className}`}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
    >
      {ticks > 0 && (
        <g className={styles.ring}>
          <circle cx={C} cy={C} r={98} fill="none" stroke="currentColor" strokeWidth={0.3} opacity={0.4} />
          {marks.map((m) => (
            <line
              key={m.i}
              x1={m.outer.x}
              y1={m.outer.y}
              x2={m.inner.x}
              y2={m.inner.y}
              stroke="currentColor"
              strokeWidth={m.major ? 0.8 : 0.4}
              opacity={m.major ? 0.95 : m.half ? 0.6 : 0.4}
            />
          ))}
          {showMoons && (
            <>
              {/* a pearled inner rule, the way an astrolabe's scales are separated */}
              <circle
                cx={C}
                cy={C}
                r={78}
                fill="none"
                stroke="currentColor"
                strokeWidth={0.9}
                strokeLinecap="round"
                strokeDasharray="0 3.1"
                opacity={0.45}
              />
              {PHASES.map((f, i) => {
                const c = pt(C, C, 83, i, 7);
                return (
                  <g key={i} className={styles.moon} style={{ "--i": i } as React.CSSProperties}>
                    <circle cx={c.x} cy={c.y} r={2.6} fill="none" stroke="currentColor" strokeWidth={0.3} opacity={0.55} />
                    {f === 0.5 ? (
                      <circle cx={c.x} cy={c.y} r={2.6} fill="currentColor" />
                    ) : (
                      <path d={moonPath(c.x, c.y, 2.6, f)} fill="currentColor" />
                    )}
                  </g>
                );
              })}
            </>
          )}
        </g>
      )}

      {star && (
        <g className={styles.star} opacity={emblem ? 1 : 0.34}>
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth={emblem ? 1 : 0.4}
            vectorEffect={emblem ? "non-scaling-stroke" : undefined}
            strokeLinejoin="round"
          />
          {verts.map((v, i) => (
            <circle key={i} cx={v.x} cy={v.y} r={emblem ? 6 : 1.4} fill="currentColor" />
          ))}
        </g>
      )}
    </svg>
  );
}
