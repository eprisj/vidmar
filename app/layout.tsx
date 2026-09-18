import type { Metadata } from "next";
import { Cormorant_Garamond, Golos_Text, Literata } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";
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

/** the reading face — letters, body copy */
const literata = Literata({
  variable: "--font-literata",
  subsets: ["cyrillic", "latin"],
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
    "ВІДЬМАР — видавництво",
    "ВІДЬМАР — бутикове видавництво книг про езотерику, містику й відьомство. Готуємо перше видання і відкриті до рукописів.",
  ),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uk"
      className={`${cormorant.variable} ${literata.variable} ${golos.variable}`}
    >
      <body>
        <ToastProvider>
          <Preloader />
          <Header />
          <main>{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
