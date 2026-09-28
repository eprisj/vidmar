import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import localFont from "next/font/local";
import Header from "@/components/Header";
import CandleLight from "@/components/CandleLight";
import Footer from "@/components/Footer";
import ToastProvider from "@/components/ToastProvider";
import { SITE_URL, getSeoAtBuild, orgJsonLd, seoMeta } from "@/lib/seo";
import Analytics from "@/components/Analytics";
import PerfGuard from "@/components/PerfGuard";
import { LITE_BOOT } from "@/lib/lite";
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

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoAtBuild();
  const base = await seoMeta(
    "ВІДЬМАР – видавництво",
    seo.default_description ||
      "ВІДЬМАР – бутикове видавництво книг про езотерику, містику й відьомство. Готуємо перше видання і відкриті до рукописів.",
  );
  const other: Record<string, string> = {};
  if (seo.bing_verification) other["msvalidate.01"] = seo.bing_verification;
  return {
    metadataBase: new URL(SITE_URL),
    ...base,
    ...(seo.google_verification || seo.bing_verification
      ? { verification: { ...(seo.google_verification ? { google: seo.google_verification } : {}), other } }
      : {}),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const seo = await getSeoAtBuild();
  return (
    <html
      lang="uk"
      // the lite flag is set by the boot script before React ever sees <html>
      suppressHydrationWarning
      className={`${denistina.variable} ${golos.variable}`}
    >
      <head>
        {/* weak devices are flagged before the first paint, so they never
            start the effects they would have to drop a second later */}
        <script dangerouslySetInnerHTML={{ __html: LITE_BOOT }} />
        {/* the header's cart badge, the catalogue and the book page all ask the
            API; the TLS handshake to it starts while the HTML is still parsing */}
        <link rel="preconnect" href="https://api.vidmar.com.ua" crossOrigin="anonymous" />
      </head>
      <body>
        <script
          type="application/ld+json"
          // the data is ours, built at build time; no user text reaches it
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd(seo)).replace(/</g, "\\u003c") }}
        />
        <Analytics />
        <ToastProvider>
          <Header />
          <CandleLight />
          <PerfGuard />
          <main>{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
