import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import localFont from "next/font/local";
import Header from "@/components/Header";
import CandleLight from "@/components/CandleLight";
import Footer from "@/components/Footer";
import ToastProvider from "@/components/ToastProvider";
import { SITE_URL, pageMeta } from "@/lib/seo";
import "./globals.css";

/** the hand — slogans and signatures only, never a paragraph.
 *
 * denistina_ua.ttf is a repaired copy. The original is a Latin script face
 * whose Cyrillic was filled in by someone else: і, ї and є were present but
 * drawn as upright serif letters, so they never triggered a font fallback —
 * they simply stood bolt upright in the middle of a cursive word. ґ and the
 * capitals І Ї Є Ґ were absent outright.
 *
 * All eight are now built from the face's own strokes: і/І reuse the Latin
 * i/I (cursive here, and identical in shape), є/Є are the font's own э/Э
 * mirrored, ї/Ї carry the diaeresis lifted out of ё, and ґ/Ґ add the upturn
 * at the point where г's stroke actually ends. Nothing is borrowed from
 * another typeface, so the line keeps one hand throughout. */
const denistina = localFont({
  src: "./fonts/denistina_ua.woff2",
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
      className={`${denistina.variable} ${golos.variable}`}
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
