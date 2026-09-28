import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

/* No canonical here: the old shared one pointed every book at /book, which
   told search engines all books were one page. /book/<slug> sets its own;
   /book?s=<slug> (books newer than the build) keeps its own address. */
const base = pageMeta("Книга – ВІДЬМАР", "Книга видавництва ВІДЬМАР.", "/book");
export const metadata: Metadata = { ...base, alternates: undefined };

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
