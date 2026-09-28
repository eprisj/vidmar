import type { Metadata } from "next";
import { API_BASE, type Book } from "./api";

export const SITE_URL = "https://vidmar.com.ua";

const OG_DEFAULT = "/og.jpg";
const OG_ALT = "Знак ВІДЬМАР – золоте тиснення на палітурній тканині";

/** What the admin set under «SEO». Read at build for titles, descriptions and
 * verification tags, and in the browser for analytics; an unreachable API
 * falls back to the texts written in the pages themselves. */
export type Seo = {
  site_name: string;
  title_suffix: string;
  default_description: string;
  og_image: string;
  keywords: string;
  noindex: boolean;
  google_verification: string;
  bing_verification: string;
  ga4_id: string;
  gtm_id: string;
  meta_pixel_id: string;
  pages: Record<string, { title: string; description: string }>;
  org: { legal_name: string; email: string; phone: string; city: string; address: string; logo: string; founded: string };
  social: Record<string, string>;
};

export const SEO_FALLBACK: Seo = {
  site_name: "ВІДЬМАР",
  title_suffix: " – ВІДЬМАР",
  default_description: "",
  og_image: "",
  keywords: "",
  noindex: false,
  google_verification: "",
  bing_verification: "",
  ga4_id: "",
  gtm_id: "",
  meta_pixel_id: "",
  pages: {},
  org: { legal_name: "", email: "", phone: "", city: "", address: "", logo: "", founded: "" },
  social: {},
};

let seoOnce: Promise<Seo> | null = null;
export function getSeoAtBuild(): Promise<Seo> {
  seoOnce ??= fetch(`${API_BASE}/seo`, { cache: "force-cache", signal: AbortSignal.timeout(8000) })
    .then((r) => (r.ok ? r.json() : SEO_FALLBACK))
    .then((x: Partial<Seo>) => ({ ...SEO_FALLBACK, ...x, pages: x.pages ?? {}, org: { ...SEO_FALLBACK.org, ...x.org }, social: x.social ?? {} }))
    .catch((err) => {
      console.warn("seo not baked in:", err instanceof Error ? err.message : err);
      return SEO_FALLBACK;
    });
  return seoOnce;
}

const abs = (u: string) => new URL(u, SITE_URL).href;

/** One title and description per page, used everywhere that page can appear:
 * the browser tab, search results and the card it unfolds into when someone
 * pastes the link into a chat. */
export function pageMeta(title: string, description: string, path = "", image?: string | null, imageAlt?: string): Metadata {
  const url = `${SITE_URL}${path}`;
  const og = { url: abs(image || OG_DEFAULT), width: 1200, height: 630, alt: imageAlt || OG_ALT };
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
      images: [og],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og.url],
    },
  };
}

/** a page's metadata with whatever the admin wrote for it on top */
export async function seoMeta(title: string, description: string, path = ""): Promise<Metadata> {
  const seo = await getSeoAtBuild();
  const key = path.replace(/^\//, "") || "home";
  const o = seo.pages[key] ?? { title: "", description: "" };
  const t = o.title ? (o.title.includes(seo.site_name) ? o.title : o.title + seo.title_suffix) : title;
  const m = pageMeta(t, o.description || description, path, seo.og_image || null);
  if (seo.keywords) m.keywords = seo.keywords.split(",").map((k) => k.trim()).filter(Boolean);
  if (seo.noindex) m.robots = { index: false, follow: false };
  return m;
}

const clip = (s: string, n: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.lastIndexOf(" ", n - 1);
  return t.slice(0, cut > n * 0.6 ? cut : n - 1) + "…";
};

export const bookPath = (slug: string) => `/book/${slug}`;

/** a book's own page: its title and author, its cover as the link card */
export async function bookMeta(b: Book): Promise<Metadata> {
  const seo = await getSeoAtBuild();
  const title = b.seo_title || `${b.title}${b.author ? ` – ${b.author}` : ""}${seo.title_suffix}`;
  const description =
    b.seo_description || clip(b.description || `${b.title}${b.author ? `, ${b.author}` : ""}. Книга видавництва ВІДЬМАР.`, 158);
  const m = pageMeta(title, description, bookPath(b.slug), b.og_image_url || b.cover_url, b.title);
  m.openGraph = {
    ...m.openGraph,
    type: "book",
    ...(b.author ? { authors: [b.author] } : {}),
    ...(b.isbn ? { isbn: b.isbn } : {}),
  } as Metadata["openGraph"];
  // demo titles are invented: shown on the site, kept out of search results
  if (seo.noindex || b.is_demo) m.robots = { index: false, follow: !seo.noindex };
  return m;
}

/** schema.org for the whole site: who publishes, and the site itself */
export function orgJsonLd(seo: Seo) {
  const sameAs = Object.values(seo.social).filter((u) => /^https?:\/\//.test(u));
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: seo.site_name || "ВІДЬМАР",
      ...(seo.org.legal_name ? { legalName: seo.org.legal_name } : {}),
      url: SITE_URL,
      logo: abs(seo.org.logo || "/icon.png"),
      ...(seo.org.email ? { email: seo.org.email } : {}),
      ...(seo.org.phone ? { telephone: seo.org.phone } : {}),
      ...(seo.org.founded ? { foundingDate: seo.org.founded } : {}),
      ...(seo.org.city || seo.org.address
        ? {
            address: {
              "@type": "PostalAddress",
              addressCountry: "UA",
              ...(seo.org.city ? { addressLocality: seo.org.city } : {}),
              ...(seo.org.address ? { streetAddress: seo.org.address } : {}),
            },
          }
        : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#site`,
      name: seo.site_name || "ВІДЬМАР",
      url: SITE_URL,
      inLanguage: "uk",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
  ];
}
