import type { Metadata } from "next";
import { Cormorant_Garamond, Golos_Text } from "next/font/google";
import localFont from "next/font/local";
import Header from "@/components/Header";
import CandleLight from "@/components/CandleLight";
import Footer from "@/components/Footer";
import ToastProvider from "@/components/ToastProvider";
import { SITE_URL, pageMeta } from "@/lib/seo";
import "./globals.css";

/** engraved display — title pages, statements, the wordmark */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

/** the hand — slogans and signatures only, never a paragraph.
 *
 * The file ships without the uppercase Ukrainian letters: І was added here
 * (it is the Latin I, glyph for glyph), but Ї, Є and Ґ are still missing, so
 * every rule that reaches for this face keeps Cormorant next in the stack —
 * the browser then falls back per glyph and a slogan degrades to a serif
 * letter instead of an empty box. */
const denistina = localFont({
  src: "./fonts/denistina_ua.ttf",
  variable: "--font-hand",
  display: "swap",
});

/** the one grotesque, kept for tiny engraved captions only */
const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMeta(
    "ВІДЬМАР – видавництво",
    "ВІДЬМАР – бутикове видавництво книг про езотерику, містику й відьомство. Готуємо перше видання і відкриті до рукописів.",
  ),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uk"
      className={`${cormorant.variable} ${denistina.variable} ${golos.variable}`}
    >
      <body>
        <ToastProvider>
          <Header />
          <CandleLight />
          <main>{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
