"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon, useAdmin } from "@/components/admin/AdminShell";
import s from "@/components/admin/admin.module.css";
import x from "@/components/admin/extra.module.css";
import { when } from "@/components/admin/labels";
import {
  addSubscriber,
  listCampaigns,
  listSubscribers,
  previewCampaign,
  removeSubscriber,
  sendCampaign,
  sendCampaignTest,
  type CampaignList,
} from "@/lib/api";

const SEARCH = "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4";
const DOWNLOAD = "M12 4v11M7 10l5 5 5-5M5 20h14";


const CAMPAIGN_STATUS = { sending: "надсилається", done: "надіслано", interrupted: "перервано" } as const;

/** write a letter, see it, send a test to yourself, then send it to the list */
function Composer({ subscribers }: { subscribers: number }) {
  const { token, fail } = useAdmin();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [data, setData] = useState<CampaignList | null>(null);

  const load = useCallback(() => {
    listCampaigns(token).then(setData).catch(() => {});
  }, [token]);
  useEffect(load, [load]);
  // while a campaign is going out, the counters follow it
  const running = data?.rows.some((r) => r.status === "sending");
  useEffect(() => {
    if (!running) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [running, load]);

  const left = data ? Math.max(0, data.quota.limit - data.quota.used) : null;
  const ready = subject.trim() && body.trim();

  async function run(what: string, fn: () => Promise<void>) {
    setBusy(what);
    setNote("");
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <section className={`${s.panel} ${s.panelBody}`} style={{ marginBottom: 16, display: "grid", gap: 12 }}>
      <h2 className={s.sectionTitle}>Новий лист підписникам</h2>
      <label className={s.field}>
        <span>Тема</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Вийшла перша книга" />
      </label>
      <label className={s.field}>
        <span>Текст · порожній рядок — новий абзац, посилання стають клікабельними</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={9} placeholder={"Добрий день!\n\nМи раді сказати, що…"} />
      </label>
      <p className={s.dim} style={{ margin: 0 }}>
        До кожного листа додається посилання «Відписатися». Сьогодні можна надіслати ще {left ?? "…"} листів із {data?.quota.limit ?? 500}.
      </p>
      <div className={x.addRow}>
        <button
          type="button"
          className={s.btn}
          disabled={!ready || !!busy}
          onClick={() => run("preview", async () => setPreview(await previewCampaign(subject, body)))}
        >
          {busy === "preview" ? "…" : "Переглянути"}
        </button>
        <label className={s.field} style={{ flex: "1 1 220px" }}>
          <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="тестовий лист на вашу пошту" aria-label="Куди надіслати тест" />
        </label>
        <button
          type="button"
          className={s.btn}
          disabled={!ready || !to.trim() || !!busy}
          onClick={() =>
            run("test", async () => {
              await sendCampaignTest(token, subject, body, to.trim());
              setNote(`Тестовий лист надіслано на ${to.trim()}.`);
            })
          }
        >
          {busy === "test" ? "Надсилаємо…" : "Надіслати тест"}
        </button>
        <button
          type="button"
          className={s.btnPrimary}
          disabled={!ready || !!busy || !subscribers || !!running}
          onClick={() => {
            if (!confirm(`Надіслати цей лист усім підписникам (${subscribers})? Скасувати не вийде.`)) return;
            run("send", async () => {
              await sendCampaign(token, subject, body);
              setNote("Розсилка пішла. Лічильник нижче оновлюється сам.");
              setSubject("");
              setBody("");
              load();
            });
          }}
        >
          {busy === "send" ? "Запускаємо…" : `Надіслати ${subscribers}`}
        </button>
      </div>
      {note && <p className={s.dim} style={{ margin: 0 }}>{note}</p>}
      {error && <p className={s.error}>{error}</p>}
      {preview && (
        <iframe
          title="Як виглядатиме лист"
          sandbox=""
          srcDoc={preview}
          style={{ width: "100%", height: 460, border: "1px solid var(--hair, #2a3a5c)", borderRadius: 10, background: "#fff" }}
        />
      )}
      {data && data.rows.length > 0 && (
        <table className={s.table}>
          <thead>
            <tr>
              <th>Лист</th>
              <th className={s.right}>Надіслано</th>
              <th className={s.right}>Стан</th>
              <th className={s.right}>Коли</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.subject}</td>
                <td className={s.right}>
                  {r.sent} з {r.total}
                  {r.failed > 0 && ` · помилок ${r.failed}`}
                </td>
                <td className={`${s.right} ${s.dim}`}>{CAMPAIGN_STATUS[r.status]}</td>
                <td className={`${s.right} ${s.dim}`}>{when(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

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

      <Composer subscribers={rows?.length ?? 0} />

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
