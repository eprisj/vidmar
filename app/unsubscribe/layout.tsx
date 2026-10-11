import type { Metadata } from "next";

/** Where the link in a newsletter leads; never for search. */
export const metadata: Metadata = {
  title: "Відписка – ВІДЬМАР",
  robots: { index: false, follow: false },
};

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
