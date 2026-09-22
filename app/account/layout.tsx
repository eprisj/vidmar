import type { Metadata } from "next";

/** The page itself is a client component and so cannot export metadata: without
 * this the tab, the bookmark and the shared link all read "ВІДЬМАР –
 * видавництво", the same as the home page. It is a personal page, so it asks
 * to stay out of search results rather than carrying a canonical and a card. */
export const metadata: Metadata = {
  title: "Кабінет – ВІДЬМАР",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
