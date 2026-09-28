"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { API_BASE } from "@/lib/api";

type Ids = { ga4_id?: string; gtm_id?: string; meta_pixel_id?: string };
type W = Window & {
  dataLayer?: unknown[];
  gtag?: (...a: unknown[]) => void;
  fbq?: ((...a: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void; push?: unknown };
  _fbq?: unknown;
};

const ID = /^[A-Za-z0-9-]{4,40}$/;

function script(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Analytics the admin switches on under «SEO»: read in the browser, so a new
 * ID works without rebuilding the site. Never runs inside the admin. */
export default function Analytics() {
  const path = usePathname();
  const ids = useRef<Ids | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (document.querySelector("[data-admin-app]")) return;
    let off = false;
    fetch(`${API_BASE}/seo`)
      .then((r) => (r.ok ? r.json() : null))
      .then((seo: Ids | null) => {
        if (off || !seo || document.querySelector("[data-admin-app]")) return;
        ids.current = seo;
        const w = window as W;
        if (seo.ga4_id && ID.test(seo.ga4_id)) {
          w.dataLayer = w.dataLayer || [];
          w.gtag = function gtag() {
            // eslint-disable-next-line prefer-rest-params
            w.dataLayer!.push(arguments);
          };
          w.gtag("js", new Date());
          w.gtag("config", seo.ga4_id);
          script(`https://www.googletagmanager.com/gtag/js?id=${seo.ga4_id}`);
        }
        if (seo.gtm_id && ID.test(seo.gtm_id)) {
          w.dataLayer = w.dataLayer || [];
          w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
          script(`https://www.googletagmanager.com/gtm.js?id=${seo.gtm_id}`);
        }
        if (seo.meta_pixel_id && /^\d{6,20}$/.test(seo.meta_pixel_id) && !w.fbq) {
          const q: unknown[] = [];
          const fbq = Object.assign(
            (...a: unknown[]) => (fbq.callMethod ? fbq.callMethod(...a) : q.push(a)),
            { queue: q, loaded: true, version: "2.0", push: undefined as unknown, callMethod: undefined as ((...a: unknown[]) => void) | undefined },
          );
          fbq.push = fbq;
          w.fbq = fbq;
          w._fbq = fbq;
          script("https://connect.facebook.net/en_US/fbevents.js");
          fbq("init", seo.meta_pixel_id);
          fbq("track", "PageView");
        }
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  // moving between pages without a reload is still a page view
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const w = window as W;
    if (ids.current?.ga4_id && w.gtag) w.gtag("event", "page_view", { page_path: path, page_location: location.href });
    if (ids.current?.meta_pixel_id && w.fbq) w.fbq("track", "PageView");
  }, [path]);

  return null;
}
