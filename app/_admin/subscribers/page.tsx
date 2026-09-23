"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, useAdmin } from "@/components/admin/AdminShell";
import s from "@/components/admin/admin.module.css";
import { when } from "@/components/admin/labels";
import { listSubscribers } from "@/lib/api";

const SEARCH = "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4";
const DOWNLOAD = "M12 4v11M7 10l5 5 5-5M5 20h14";

export default function SubscribersPage() {
  const { token, fail } = useAdmin();
  const [rows, setRows] = useState<{ id: number; email: string; created_at: string }[] | null>(null);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listSubscribers(token)
      .then(setRows)
      .catch((e) => setError(fail(e)));
  }, [token, fail]);

  const shown = useMemo(
    () => (rows ?? []).filter((r) => !q.trim() || r.email.includes(q.trim().toLowerCase())),
    [rows, q],
  );

  function exportCsv() {
    const body = ["email,subscribed_at", ...shown.map((r) => `${r.email},${r.created_at}`)].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
    a.download = `vidmar-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Розсилка</h1>
          <p className={s.sub}>{rows?.length ?? 0} підписників</p>
        </div>
        <div className={s.headActions}>
          <button
            type="button"
            className={s.btn}
            disabled={!shown.length}
            onClick={async () => {
              await navigator.clipboard?.writeText(shown.map((r) => r.email).join(", "));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Скопійовано" : "Скопіювати адреси"}
          </button>
          <button type="button" className={s.btn} disabled={!shown.length} onClick={exportCsv}>
            <Icon d={DOWNLOAD} size={16} /> CSV
          </button>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.toolbar}>
        <label className={s.search}>
          <Icon d={SEARCH} size={16} />
          <input type="search" placeholder="Пошук адреси" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className={s.tableWrap}>
        {rows === null ? (
          <div className={s.empty}>Завантаження…</div>
        ) : shown.length === 0 ? (
          <div className={s.empty}>Підписників поки немає.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Пошта</th>
                <th className={s.right}>Підписався</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>
                    <a href={`mailto:${r.email}`}>{r.email}</a>
                  </td>
                  <td className={`${s.right} ${s.dim}`}>{when(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
