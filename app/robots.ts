import type { MetadataRoute } from "next";
import { SITE_URL, getSeoAtBuild } from "@/lib/seo";

/** `output: export` builds these as files, which Next only does when the
 * route is explicitly static. */
export const dynamic = "force-static";

/** The site had no robots.txt at all, so crawlers had no statement of intent
 * and no pointer to the sitemap. The admin is deliberately not named here:
 * robots.txt is public, and a Disallow line would hand out its address. It
 * carries its own noindex instead. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  // «Сховати сайт від пошукових систем» in the admin's SEO page
  const hidden = (await getSeoAtBuild()).noindex;
  return {
    rules: hidden
      ? { userAgent: "*", disallow: "/" }
      : {
          userAgent: "*",
          allow: "/",
          // cart, order and account pages are personal: nothing to find there
          disallow: ["/cart", "/order", "/account"],
        },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
