"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { getPublishStatus, requestPublish, type PublishStatus } from "@/lib/api";
import { TEXT_FIELDS } from "@/lib/siteText";
import Drawer from "./Drawer";
import { requestOpen } from "./openRequest";
import { when } from "./labels";
import s from "./admin.module.css";
import u from "./publish.module.css";

/* The site is a static export: prices, stock and texts reach readers at once
   through the API, but search engines, shared-link cards, the sitemap and the
   page of a new book only change when the server rebuilds the HTML. This is
   the button for that, with what is waiting and how the last run went. */

const UP = "M12 16V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4";
const IDLE_MS = 45_000;
const BUSY_MS = 4_000;

const textLabel = (key: string) => TEXT_FIELDS.find((f) => f.key === key)?.label ?? key;

function pendingCount(st: PublishStatus) {
  const p = st.pending;
  return p.books.length + p.deleted_books + p.texts.length + (p.seo ? 1 : 0);
}

const busy = (st: PublishStatus) => st.queued || st.state === "building";

export default function Publish({
  token,
  base,
  tick,
  fail,
  className,
}: {
  token: string;
  base: string;
  /** bumped by refreshCounts after a save elsewhere */
  tick: number;
  fail: (err: unknown) => string;
  className: string;
}) {
  const [st, setSt] = useState<PublishStatus | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setSt(await getPublishStatus(token));
    } catch (e) {
      fail(e);
    }
  }, [token, fail]);

  useEffect(() => {
    load();
  }, [load, tick]);

  // quick while a build is queued or going, slow otherwise; never in a hidden tab
  const working = !!st && busy(st);
  useEffect(() => {
    if (st === null) return;
    const t = setInterval(() => !document.hidden && load(), working ? BUSY_MS : IDLE_MS);
    const onVisible = () => !document.hidden && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [st, working, load]);

  const close = useCallback(() => setOpen(false), []);

  // an API without publishing: no button at all
  if (!st) return null;

  const n = pendingCount(st);
  const label = working
    ? "Публікується…"
    : st.state === "failed"
      ? "Публікація не вдалася"
      : n
        ? "Опублікувати"
        : "Сайт актуальний";

  const go = async () => {
    setSending(true);
    setError("");
    try {
      setSt(await requestPublish(token));
    } catch (e) {
      setError(fail(e));
    } finally {
      setSending(false);
    }
  };

  const p = st.pending;
  return (
    <>
      <button
        type="button"
        className={`${className} ${working ? u.working : st.state === "failed" ? u.failed : n ? "" : u.calm}`}
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" width={18} height={18} className={`${s.icon} ${working ? u.spin : ""}`} aria-hidden="true">
          <path d={working ? "M12 3a9 9 0 1 0 9 9" : UP} />
        </svg>
        <span>{label}</span>
        {!working && n > 0 && <em className={s.badge}>{n}</em>}
      </button>

      {/* the button sits in the sticky sidebar, whose stacking context would
          keep the drawer under the page; it opens at the admin's root instead,
          where the colour tokens live */}
      {open &&
        createPortal(
          <Drawer
            title="Публікація сайту"
            sub="Ціни, наявність і тексти читачі бачать одразу. Публікація потрібна, щоб зміни потрапили в пошук, у картки посилань і щоб нова книга отримала власну сторінку."
            onClose={close}
            foot={
              <>
                <button type="button" className={s.btnGhost} onClick={close}>
                  Закрити
                </button>
                <button type="button" className={s.btn} onClick={go} disabled={sending || st.queued}>
                  {st.queued ? "У черзі" : st.state === "building" ? "Ще раз після цієї" : sending ? "Надсилаю…" : "Опублікувати зараз"}
                </button>
              </>
            }
          >
            {error && <p className={s.error}>{error}</p>}

            <div className={u.state}>
              {st.state === "building" ? (
                <p>
                  <b>Збирається</b> з {when(st.started_at)}
                  {st.requested_by ? ` · запустив ${st.requested_by}` : ""}. Зазвичай це 1–3 хвилини.
                  {st.queued && " Наступна публікація вже в черзі й почнеться одразу після цієї."}
                </p>
              ) : st.queued ? (
                <p>
                  <b>У черзі.</b> Сервер почне збирати сайт протягом хвилини.
                </p>
              ) : st.state === "failed" ? (
                <>
                  <p className={s.error}>
                    Публікація {when(st.started_at)} не вдалася{st.error ? `: ${st.error}` : ""}. На сайті лишилася попередня версія.
                  </p>
                  {st.log.length > 0 && <pre className={u.log}>{st.log.join("\n")}</pre>}
                </>
              ) : null}
              <p className={s.dim}>
                {st.published_done_at
                  ? `Остання вдала публікація: ${when(st.published_done_at)}${st.commit ? ` · версія ${st.commit.slice(0, 7)}` : ""}`
                  : "Із адмінки сайт ще не публікувався."}
              </p>
            </div>

            <h3 className={u.h3}>{n ? `Ще не на сайті · ${n}` : "Усе вже на сайті"}</h3>
            {n > 0 && (
              <ul className={u.list}>
                {p.books.map((b) => (
                  <li key={`b${b.id}`}>
                    <Link
                      href={`${base}/books?open=${b.id}`}
                      onClick={() => {
                        requestOpen("books", b.id);
                        close();
                      }}
                    >
                      {b.title}
                    </Link>
                    <span className={s.dim}>книга · {when(b.updated_at)}</span>
                  </li>
                ))}
                {p.deleted_books > 0 && (
                  <li>
                    <span>Видалено книг: {p.deleted_books}</span>
                    <span className={s.dim}>їхні сторінки ще відкриваються</span>
                  </li>
                )}
                {p.texts.map((t) => (
                  <li key={`t${t.key}`}>
                    <Link href={`${base}/content`} onClick={close}>
                      {textLabel(t.key)}
                    </Link>
                    <span className={s.dim}>текст · {when(t.updated_at)}</span>
                  </li>
                ))}
                {p.seo && (
                  <li>
                    <Link href={`${base}/seo`} onClick={close}>
                      Налаштування SEO
                    </Link>
                    <span className={s.dim}>заголовки й описи сторінок</span>
                  </li>
                )}
              </ul>
            )}
          </Drawer>,
          document.querySelector("[data-admin-app]") ?? document.body,
        )}
    </>
  );
}
