"use client";

import { createElement, useSyncExternalStore } from "react";
import { API_BASE } from "@/lib/api";
import { TEXT_DEFAULTS } from "@/lib/siteText";
import LitText from "./LitText";

/*
 * Texts the admin changed, swapped in over the built-in ones.
 *
 * The first render (on the server and in hydration) always uses the built-in
 * text, so the static HTML stays complete and hydration never mismatches.
 * Then the saved texts arrive – from this browser's copy of the last answer
 * at once, and from the API a moment later – and every field re-renders.
 */

type Store = Record<string, unknown>;
const CACHE = "vidmar-content-v1";
let store: Store | null = null;
let started = false;
const listeners = new Set<() => void>();

function set(next: Store) {
  store = next;
  listeners.forEach((l) => l());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const cached = localStorage.getItem(CACHE);
    if (cached) queueMicrotask(() => set(JSON.parse(cached)));
  } catch {}
  fetch(`${API_BASE}/content`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || typeof data !== "object") return;
      set(data);
      try {
        localStorage.setItem(CACHE, JSON.stringify(data));
      } catch {}
    })
    .catch(() => {});
}

function subscribe(l: () => void) {
  listeners.add(l);
  start();
  return () => listeners.delete(l);
}

const isList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");
const isRecords = (v: unknown): v is Record<string, string>[] =>
  Array.isArray(v) && v.every((x) => x && typeof x === "object" && !Array.isArray(x));

/** the saved value when it has the same shape as the default, else the default */
export function useSiteText<T = string>(key: string): T {
  const saved = useSyncExternalStore(
    subscribe,
    () => store?.[key],
    () => undefined,
  );
  const d = TEXT_DEFAULTS[key];
  if (saved === undefined || saved === null) return d as T;
  if (typeof d === "string") return (typeof saved === "string" && saved.trim() ? saved : d) as T;
  if (isList(d)) return (isList(saved) && saved.length ? saved : d) as T;
  return (isRecords(saved) && saved.length ? saved : d) as T;
}

/** a plain editable text */
export function Txt({ k }: { k: string }) {
  return <>{useSiteText(k)}</>;
}

/** an editable text lit word by word */
export function LitTxt({ k, className }: { k: string; className?: string }) {
  const text = useSiteText(k);
  // keyed, so a changed text starts its own reveal instead of reusing the old words
  return <LitText key={text} text={text} className={className} />;
}

/** list items of an editable list */
export function TxtItems({ k, as = "li", className }: { k: string; as?: string; className?: string }) {
  const items = useSiteText<string[]>(k);
  return <>{items.map((t, i) => createElement(as, { key: i, className }, t))}</>;
}

/** the contact address, as a mail link */
export function MailLink({ className, subject }: { className?: string; subject?: string }) {
  const email = useSiteText("site.email");
  return (
    <a className={className} href={`mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`}>
      {email}
    </a>
  );
}
