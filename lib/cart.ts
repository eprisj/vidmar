"use client";

import { useSyncExternalStore } from "react";
import type { Format } from "./api";

/** The cart lives in the browser, so it works without an account; the
 * server re-prices every line at checkout and never trusts these numbers. */
export type CartLine = {
  slug: string;
  format: Format;
  quantity: number;
  title: string;
  author: string | null;
  price_cents: number;
  cover_url: string | null;
  cover_pos: string | null;
};

const KEY = "vidmar_cart_v1";
const EMPTY: CartLine[] = [];
let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* private mode: the cart still works for this tab */
  }
  listeners.forEach((l) => l());
}

export function addLine(line: Omit<CartLine, "quantity">, quantity = 1) {
  const lines = read();
  const i = lines.findIndex((l) => l.slug === line.slug && l.format === line.format);
  if (i >= 0) {
    // an e-book is one file: buying it twice makes no sense
    if (line.format === "ebook") return;
    const next = [...lines];
    next[i] = { ...next[i], quantity: Math.min(20, next[i].quantity + quantity) };
    write(next);
  } else {
    write([...lines, { ...line, quantity }]);
  }
}

export function setQuantity(slug: string, format: Format, quantity: number) {
  write(
    read()
      .map((l) => (l.slug === slug && l.format === format ? { ...l, quantity: Math.min(20, quantity) } : l))
      .filter((l) => l.quantity > 0),
  );
}

export function removeLine(slug: string, format: Format) {
  write(read().filter((l) => !(l.slug === slug && l.format === format)));
}

export function clearCart() {
  write([]);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((n, l) => n + l.quantity, 0);
}
