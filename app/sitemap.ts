import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** `output: export` builds these as files, which Next only does when the
 * route is explicitly static. */
export const dynamic = "force-static";

/** The public pages, in the order they matter. Account, cart and admin are
 * left out: they are personal or private, and none of them is a page anyone
 * should reach from a search result. */
const pages: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/about", priority: 0.8 },
  { path: "/genres", priority: 0.8 },
  { path: "/submissions", priority: 0.8 },
  { path: "/catalog", priority: 0.6 },
  { path: "/journal", priority: 0.5 },
  { path: "/privacy", priority: 0.2 },
  { path: "/terms", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return pages.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }));
}
