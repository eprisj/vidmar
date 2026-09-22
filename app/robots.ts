import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** `output: export` builds these as files, which Next only does when the
 * route is explicitly static. */
export const dynamic = "force-static";

/** The site had no robots.txt at all, so crawlers had no statement of intent
 * and no pointer to the sitemap. Admin is disallowed here as well as carrying
 * its own noindex. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
