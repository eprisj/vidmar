/**
 * One small engraved emblem per genre — solid ink silhouettes in the same
 * hand as the forest and the shelf, standing in for the six directions the
 * founder named rather than illustrating any one book. Touch devices never
 * saw the hover panel that used to carry this much visual weight, so the
 * catalogue read as a bare list there; these sit in the row itself and
 * work with or without a pointer.
 */

const ICONS: Record<string, React.ReactNode> = {
  // a crescent moon and its one star — esoterica and mysticism
  ezoteryka: (
    <>
      <path d="M30 8a17 17 0 1 0 0 32 21 21 0 0 1 0-32Z" />
      <path d="M38 6l1.8 4.2L44 12l-4.2 1.8L38 18l-1.8-4.2L32 12l4.2-1.8Z" />
    </>
  ),
  // a three-legged cauldron with a curl of smoke — witchcraft and practice
  vidmovstvo: (
    <>
      <path d="M14 22h20l-2.4 12a8 8 0 0 1-7.8 6.4h0a8 8 0 0 1-7.8-6.4L14 22Z" />
      <path d="M12 20h24v3H12z" />
      <path d="M15 22l-4 6M33 22l4 6M24 22v-4" />
      <path
        d="M24 15c-2.4-2-2.4-4.4 0-6.4-1.2 2.4-.2 3.8 1.6 3.4 1.6-.4 2.2 1 1 2.4-1.2 1.4-1 2.6.4 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  ),
  // a dagger, point down — thrillers
  tryler: (
    <>
      <path d="M23 6h2v20h-2z" />
      <path d="M16 12h16v3H16z" />
      <path d="M24 26l4 4-4 12-4-12Z" />
      <path d="M22 10h4v3h-4z" />
    </>
  ),
  // a mask split by a hairline crack — psychological novels
  psyhroman: (
    <>
      <path d="M24 8c9 0 14 6 14 14s-5 16-14 16S10 30 10 22 15 8 24 8Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="18.5" cy="21" r="2.1" />
      <circle cx="29.5" cy="21" r="2.1" />
      <path d="M24 8v30" stroke="currentColor" strokeWidth="1.2" fill="none" strokeDasharray="1.5 2.4" />
    </>
  ),
  // a crown, three points — fantasy
  fentezi: (
    <>
      <path d="M10 32l2-16 8 8 4-12 4 12 8-8 2 16Z" />
      <path d="M10 32h28v4H10z" />
    </>
  ),
  // a quill and the drop it just set down — mystic prose
  "mistyka-proza": (
    <>
      <path d="M38 6C24 10 15 21 12 38c8-3 12-8 13-13 5-1 10-5 13-19Z" />
      <circle cx="15" cy="40" r="2" />
    </>
  ),
};

export default function GenreIcon({ slug, className }: { slug: string; className?: string }) {
  const icon = ICONS[slug];
  if (!icon) return null;
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" className={className} aria-hidden="true">
      {icon}
    </svg>
  );
}
