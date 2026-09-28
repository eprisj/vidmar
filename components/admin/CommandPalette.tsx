"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminSearch, type SearchHits } from "@/lib/api";
import { ORDER_STATUS, SUBMISSION_STATUS, uah } from "./labels";
import { requestOpen } from "./openRequest";
import p from "./plus.module.css";

type Hit = { key: string; group: string; icon: string; main: string; sub?: string; right?: string; go: () => void };

const G = {
  order: "M6 3h12l1 4H5zM5 7h14v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z",
  book: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  script: "M14 3H6v18h12V7zM14 3v4h4",
  page: "M9 18l6-6-6-6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
};

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** One box for the whole back office: records by number, name, phone, TTN,
 * SKU or reader code, plus a jump to any section. Ctrl/⌘+K or "/" opens it. */
export default function CommandPalette({
  token,
  base,
  nav,
  open,
  setOpen,
}: {
  token: string;
  base: string;
  nav: { href: string; label: string }[];
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHits | null>(null);
  const [busy, setBusy] = useState(false);
  const [at, setAt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]");
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setQ("");
      setHits(null);
      setAt(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits(null);
      return;
    }
    setBusy(true);
    const t = setTimeout(() => {
      adminSearch(token, term)
        .then(setHits)
        .catch(() => setHits({ orders: [], books: [], users: [], submissions: [] }))
        .finally(() => setBusy(false));
    }, 180);
    return () => clearTimeout(t);
  }, [q, token]);

  const go = (section: string, path: string, id: number) => {
    setOpen(false);
    router.push(`${base}/${path}?open=${id}`);
    // already on that page: it hears the request instead of remounting
    setTimeout(() => requestOpen(section, id), 60);
  };

  const items: Hit[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pages: Hit[] = nav
      .filter((n) => !term || n.label.toLowerCase().includes(term))
      .map((n) => ({
        key: "nav" + n.href,
        group: "Розділи",
        icon: G.page,
        main: n.label,
        go: () => {
          setOpen(false);
          router.push(n.href);
        },
      }));
    if (!hits) return pages;
    return [
      ...hits.orders.map((o) => ({
        key: "o" + o.id,
        group: "Замовлення",
        icon: G.order,
        main: `№${o.id} · ${o.customer_name || o.customer_email || "–"}`,
        sub: [ORDER_STATUS[o.status] ?? o.status, o.customer_phone, o.ttn && `ТТН ${o.ttn}`].filter(Boolean).join(" · "),
        right: uah(o.total_cents),
        go: () => go("orders", "orders", o.id),
      })),
      ...hits.books.map((b) => ({
        key: "b" + b.id,
        group: "Книги",
        icon: G.book,
        main: b.title,
        sub: [b.author, b.sku].filter(Boolean).join(" · "),
        go: () => go("books", "books", b.id),
      })),
      ...hits.users.map((u) => ({
        key: "u" + u.id,
        group: "Читачі",
        icon: G.user,
        main: u.name || u.email,
        sub: [u.name ? u.email : null, u.phone, u.reader_code].filter(Boolean).join(" · "),
        go: () => go("users", "users", u.id),
      })),
      ...hits.submissions.map((x) => ({
        key: "s" + x.id,
        group: "Рукописи",
        icon: G.script,
        main: x.title || "Без назви",
        sub: `${x.name} · ${SUBMISSION_STATUS[x.status] ?? x.status}`,
        go: () => go("manuscripts", "manuscripts", x.id),
      })),
      ...pages,
    ];
    // go and router are stable enough for a list rebuilt on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, q, nav, base]);

  useEffect(() => setAt(0), [items.length]);

  useEffect(() => {
    list.current?.querySelector(`[data-i="${at}"]`)?.scrollIntoView({ block: "nearest" });
  }, [at]);

  if (!open) return null;

  let lastGroup = "";
  return (
    <>
      <div className={p.paletteScrim} onClick={() => setOpen(false)} />
      <div className={p.palette} role="dialog" aria-modal="true" aria-label="Пошук">
        <div className={p.paletteInput}>
          <Glyph d={G.search} />
          <input
            ref={input}
            value={q}
            placeholder="№ замовлення, імʼя, телефон, ТТН, книга, артикул, код читача…"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setAt((i) => Math.min(items.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setAt((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                items[at]?.go();
              }
            }}
          />
          <span className={p.kbd}>Esc</span>
        </div>
        <div className={p.paletteBody} ref={list}>
          {items.length === 0 ? (
            <div className={p.paletteEmpty}>{busy ? "Шукаємо…" : "Нічого не знайшлось."}</div>
          ) : (
            items.map((h, i) => {
              const head = h.group !== lastGroup;
              lastGroup = h.group;
              return (
                <div key={h.key}>
                  {head && <div className={p.paletteGroup}>{h.group}</div>}
                  <button
                    type="button"
                    data-i={i}
                    className={`${p.hit} ${i === at ? p.hitOn : ""}`}
                    onMouseEnter={() => setAt(i)}
                    onClick={h.go}
                  >
                    <span className={p.hitIcon}>
                      <Glyph d={h.icon} />
                    </span>
                    <span className={p.hitMain}>
                      {h.main}
                      {h.sub && (
                        <>
                          <br />
                          <span className={p.hitSub}>{h.sub}</span>
                        </>
                      )}
                    </span>
                    {h.right && <span className={p.hitSub}>{h.right}</span>}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className={p.paletteFoot}>
          <span>
            <span className={p.kbd}>↑</span> <span className={p.kbd}>↓</span> вибір
          </span>
          <span>
            <span className={p.kbd}>Enter</span> відкрити
          </span>
          <span>
            <span className={p.kbd}>Ctrl K</span> будь-де
          </span>
        </div>
      </div>
    </>
  );
}
