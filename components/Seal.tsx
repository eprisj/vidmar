import styles from "./Seal.module.css";

type Props = {
  /** ticks around the outer ring */
  ticks?: number;
  /** draw the heptagram inside the ring */
  star?: boolean;
  className?: string;
};

const round = (n: number) => Number(n.toFixed(3));

/** point on a circle, 0 = top */
function pt(cx: number, cy: number, r: number, i: number, total: number) {
  const a = (i / total) * Math.PI * 2 - Math.PI / 2;
  return { x: round(cx + Math.cos(a) * r), y: round(cy + Math.sin(a) * r) };
}

/**
 * The publisher's mark: a ring of engraved ticks around a heptagram — the
 * seven-pointed witch's star. Hairline-thin so it reads as an instrument
 * scale rather than an ornament.
 */
export default function Seal({ ticks = 96, star = true, className = "" }: Props) {
  const C = 100;

  // {7/3} heptagram: step three vertices at a time around seven points
  const verts = Array.from({ length: 7 }, (_, i) => pt(C, C, 58, i, 7));
  const path =
    Array.from({ length: 7 }, (_, i) => verts[(i * 3) % 7])
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
      .join(" ") + " Z";

  const marks = Array.from({ length: ticks }, (_, i) => {
    const major = i % 8 === 0;
    const outer = pt(C, C, 97, i, ticks);
    const inner = pt(C, C, major ? 88 : 92, i, ticks);
    return { i, major, outer, inner };
  });

  return (
    <svg
      className={`${styles.seal} ${className}`}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.ring}>
        {marks.map((m) => (
          <line
            key={m.i}
            x1={m.outer.x}
            y1={m.outer.y}
            x2={m.inner.x}
            y2={m.inner.y}
            stroke="currentColor"
            strokeWidth={m.major ? 0.8 : 0.4}
            opacity={m.major ? 0.9 : 0.5}
          />
        ))}
      </g>

      {star && (
        <g className={styles.star} opacity="0.34">
          <path d={path} fill="none" stroke="currentColor" strokeWidth="0.4" />
          {verts.map((v, i) => (
            <circle key={i} cx={v.x} cy={v.y} r="1.4" fill="currentColor" />
          ))}
        </g>
      )}
    </svg>
  );
}
