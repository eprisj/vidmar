import type { Metadata } from "next";

/** See app/account/layout.tsx — a client page can't carry its own title, and a
 * cart belongs to one person rather than in a search result. */
export const metadata: Metadata = {
  title: "Кошик – ВІДЬМАР",
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
