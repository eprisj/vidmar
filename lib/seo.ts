import type { Metadata } from "next";

/** The site lives on a sub-path, so card and canonical URLs are written out in
 * full — a leading-slash path would resolve against the domain root and drop
 * the /vidmar segment. */
export const SITE_URL = "https://munister.com.ua/vidmar";

const OG_IMAGE = {
  url: `${SITE_URL}/og.jpg`,
  width: 1200,
  height: 630,
  alt: "Знак ВІДЬМАР — золоте тиснення на палітурній тканині",
};

/** One title and description per page, used everywhere that page can appear:
 * the browser tab, search results and the card it unfolds into when someone
 * pastes the link into a chat. */
export function pageMeta(
  title: string,
  description: string,
  path = "",
): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "uk_UA",
      siteName: "ВІДЬМАР",
      title,
      description,
      url,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
