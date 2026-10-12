import type { ReactNode } from "react";

/** The journal's line icons: one stroke weight, round ends, drawn on a 24 grid
 * so they sit with the site's engraved marks. One for each rubric, and a few
 * for the small things around a text. */
const paths: Record<string, ReactNode> = {
  // a card with a moon in it
  taro: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2" />
      <path d="M14.4 12.2a3.1 3.1 0 1 1-3.7-4.9 2.5 2.5 0 0 0 3.7 4.9z" />
      <path d="M9 17.5h6M9 5.5h1M14 5.5h1" />
    </>
  ),
  // a candle and its flame
  obriad: (
    <>
      <rect x="9" y="11" width="6" height="9" rx="1" />
      <path d="M12 2.8c1.9 2.1 2.7 3.6 2.7 5a2.7 2.7 0 0 1-5.4 0c0-1.4.8-2.9 2.7-5z" />
      <path d="M6.5 20.5h11" />
    </>
  ),
  // a sun with its rays
  mif: (
    <>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 3v2.6M12 18.4V21M3 12h2.6M18.4 12H21M5.6 5.6l1.9 1.9M16.5 16.5l1.9 1.9M18.4 5.6l-1.9 1.9M7.5 16.5l-1.9 1.9" />
    </>
  ),
  // a quill
  dumky: (
    <>
      <path d="M20.5 3.5c-7.2 0-12.2 3.9-13.7 11L5 20.3l5.6-1.7c7.2-1.5 9.9-7.4 9.9-15.1z" />
      <path d="M9.5 15.5l6-6" />
    </>
  ),
  // an open book
  polytsia: (
    <>
      <path d="M3.5 5.6c2.7-1.1 5.9-.9 8.5.6 2.6-1.5 5.8-1.7 8.5-.6v13.6c-2.7-1-5.9-.8-8.5.7-2.6-1.5-5.8-1.7-8.5-.7z" />
      <path d="M12 6.2v13.7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  arrow: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  back: <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />,
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  // the Telegram plane
  telegram: <path d="M21 3.5L2.8 10.6l6.1 2.3 2.2 6.6 3.1-4.2 5.2 3.8z M8.9 12.9l8.4-5.8" />,
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, className }: { name: IconName | string; size?: number; className?: string }) {
  const p = paths[name] ?? paths.taro;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {p}
    </svg>
  );
}
