"use client";

import { useEffect, useRef } from "react";

/** The search palette asks a page to open one record: by ?open=<id> in the
 * address when it navigates there, and by an event when the page is already
 * on screen (a same-page push does not remount it). */
const EVENT = "vidmar-admin-open";

export function requestOpen(section: string, id: number) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { section, id } }));
}

export function useOpenRequest(section: string, ready: boolean, onOpen: (id: number) => void) {
  const cb = useRef(onOpen);
  cb.current = onOpen;
  useEffect(() => {
    if (!ready) return;
    const id = Number(new URLSearchParams(window.location.search).get("open"));
    if (id) cb.current(id);
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ section: string; id: number }>).detail;
      if (d?.section === section) cb.current(d.id);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [section, ready]);
}
