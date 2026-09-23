import type { Metadata } from "next";

/** Where a reader card's QR leads; one page per card, never for search. */
export const metadata: Metadata = {
  title: "Картка читача – ВІДЬМАР",
  robots: { index: false, follow: false },
};

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
