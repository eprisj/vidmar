"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import Drawer from "@/components/admin/Drawer";
import s from "@/components/admin/admin.module.css";
import { SUBMISSION_STATUS, when } from "@/components/admin/labels";
import { listSubmissions, setSubmissionStatus, type Submission } from "@/lib/api";
import { genres } from "@/lib/content";

const FLOW: Submission["status"][] = ["new", "reading", "accepted", "declined"];

export default function ManuscriptsPage() {
  const { token, fail, refreshCounts } = useAdmin();
  const [rows, setRows] = useState<Submission[] | null>(null);
  const [tab, setTab] = useState<"all" | Submission["status"]>("all");
  const [open, setOpen] = useState<Submission | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      listSubmissions(token)
        .then((x) => setRows(x.map((r) => ({ ...r, status: r.status ?? "new" }))))
        .catch((e) => setError(fail(e))),
    [token, fail],
  );

  useEffect(() => {
    load();
  }, [load]);

  const all = rows ?? [];
  const shown = useMemo(() => (tab === "all" ? all : all.filter((r) => r.status === tab)), [all, tab]);

  async function move(r: Submission, status: Submission["status"]) {
    try {
      await setSubmissionStatus(token, r.id, status);
      setOpen((o) => (o && o.id === r.id ? { ...o, status } : o));
      load();
      refreshCounts();
    } catch (e) {
      setError(fail(e));
    }
  }

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Рукописи</h1>
          <p className={s.sub}>Заявки авторів з форми «Надіслати рукопис»</p>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.toolbar}>
        <div className={s.tabs} role="tablist">
          {(["all", ...FLOW] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={`${s.tab} ${tab === k ? s.tabOn : ""}`}
              onClick={() => setTab(k)}
            >
              {k === "all" ? "Усі" : SUBMISSION_STATUS[k]}
              <i>{k === "all" ? all.length : all.filter((r) => r.status === k).length}</i>
            </button>
          ))}
        </div>
      </div>

      <div className={s.tableWrap}>
        {rows === null ? (
          <div className={s.empty}>Завантаження…</div>
        ) : shown.length === 0 ? (
          <div className={s.empty}>Тут порожньо.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Рукопис</th>
                <th>Автор</th>
                <th className={s.hideSm}>Напрям</th>
                <th className={s.hideSm}>Надійшов</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className={s.rowLink} onClick={() => setOpen(r)}>
                  <td>
                    <span className={s.strong}>{r.title || "Без назви"}</span>
                    <br />
                    <span className={s.dim}>{(r.note ?? "").slice(0, 80)}{(r.note ?? "").length > 80 ? "…" : ""}</span>
                  </td>
                  <td>
                    {r.name}
                    <br />
                    <span className={s.dim}>{r.email}</span>
                  </td>
                  <td className={s.hideSm}>{genres.find((g) => g.slug === r.genre)?.title ?? r.genre ?? "–"}</td>
                  <td className={`${s.hideSm} ${s.dim}`}>{when(r.created_at)}</td>
                  <td>
                    <span className={`${s.pill} ${s[`s_${r.status}`]}`}>{SUBMISSION_STATUS[r.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Drawer
          title={open.title || "Без назви"}
          sub={`${open.name} · ${when(open.created_at)}`}
          onClose={() => setOpen(null)}
          foot={
            <a
              className={s.btnPrimary}
              href={`mailto:${open.email}?subject=${encodeURIComponent(`Рукопис «${open.title || ""}» – ВІДЬМАР`)}`}
            >
              Відповісти автору
            </a>
          }
        >
          <div className={s.section}>
            <span className={s.sectionTitle}>Статус</span>
            <div className={s.statusBtns}>
              {FLOW.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`${s.statusBtn} ${open.status === k ? s.statusBtnOn : ""}`}
                  onClick={() => move(open, k)}
                >
                  {SUBMISSION_STATUS[k]}
                </button>
              ))}
            </div>
          </div>
          <div className={s.section}>
            <span className={s.sectionTitle}>Автор</span>
            <dl className={s.dl}>
              <dt>Імʼя</dt>
              <dd>{open.name}</dd>
              <dt>Пошта</dt>
              <dd>
                <a href={`mailto:${open.email}`}>{open.email}</a>
              </dd>
              <dt>Напрям</dt>
              <dd>{genres.find((g) => g.slug === open.genre)?.title ?? open.genre ?? "–"}</dd>
            </dl>
          </div>
          <div className={s.section}>
            <span className={s.sectionTitle}>Про рукопис</span>
            <div className={s.note}>{open.note || "–"}</div>
          </div>
        </Drawer>
      )}
    </>
  );
}
