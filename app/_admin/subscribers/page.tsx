"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, useAdmin } from "@/components/admin/AdminShell";
import s from "@/components/admin/admin.module.css";
import x from "@/components/admin/extra.module.css";
import { when } from "@/components/admin/labels";
import { addSubscriber, listSubscribers, removeSubscriber } from "@/lib/api";

const SEARCH = "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4";
const DOWNLOAD = "M12 4v11M7 10l5 5 5-5M5 20h14";

export default function SubscribersPage() {
  const { token, fail } = useAdmin();
  const [rows, setRows] = useState<{ id: number; email: string; created_at: string }[] | null>(null);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState("");

  const month = useMemo(
    () => (rows ?? []).filter((r) => Date.now() - new Date(r.created_at).getTime() < 30 * 86_400_000).length,
    [rows],
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await addSubscriber(token, email);
      setRows((all) => [r, ...(all ?? [])]);
      setAdded(r.email);
      setEmail("");
      setTimeout(() => setAdded(""), 2500);
    } catch (err) {
      setError(fail(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: { id: number; email: string }) {
    if (!confirm(`Відписати ${r.email}? Адреса зникне зі списку розсилки.`)) return;
    try {
      await removeSubscriber(token, r.id);
      setRows((all) => (all ?? []).filter((y) => y.id !== r.id));
    } catch (err) {
      setError(fail(err));
    }
  }

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
          <p className={s.sub}>
            {rows?.length ?? 0} підписників{month > 0 && ` · +${month} за 30 днів`}
          </p>
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

      <form className={`${s.panel} ${s.panelBody}`} onSubmit={add} style={{ marginBottom: 16 }}>
        <div className={x.addRow}>
          <label className={s.field} style={{ flex: "1 1 260px" }}>
            <span>Додати адресу вручну · наприклад, підписалися на ярмарку</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="reader@example.com" required />
          </label>
          <button type="submit" className={s.btnPrimary} disabled={busy || !email.trim()} style={{ alignSelf: "flex-end" }}>
            {busy ? "Додаємо…" : "Додати"}
          </button>
          {added && <span className={s.dim} style={{ alignSelf: "flex-end" }}>{added} додано</span>}
        </div>
      </form>

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
                <th className={s.right} aria-label="Дії" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>
                    <a href={`mailto:${r.email}`}>{r.email}</a>
                  </td>
                  <td className={`${s.right} ${s.dim}`}>{when(r.created_at)}</td>
                  <td className={s.right}>
                    <button type="button" className={x.rowAction} onClick={() => remove(r)}>
                      Відписати
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
