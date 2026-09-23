import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("Книга – ВІДЬМАР", "Книга видавництва ВІДЬМАР.", "/book");

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
