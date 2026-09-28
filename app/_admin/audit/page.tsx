"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdmin } from "@/components/admin/AdminShell";
import s from "@/components/admin/admin.module.css";
import p from "@/components/admin/plus.module.css";
import { ORDER_STATUS, SUBMISSION_STATUS } from "@/components/admin/labels";
import { listAudit, type AuditRow } from "@/lib/api";

const ENTITIES: Record<string, string> = {
  orders: "Замовлення",
  books: "Книги",
  files: "Файли",
  media: "Зображення",
  content: "Контент",
  submissions: "Рукописи",
  promos: "Промокоди",
  team: "Команда",
  sessions: "Сесії",
  auth: "Вхід і пароль",
};

const str = (v: unknown) => (v == null ? "" : String(v));

/** the journal row in words: what was done to what */
function describe(r: AuditRow): string {
  const d = r.details ?? {};
  const id = r.entity_id;
  const seg = r.path.split("/").filter(Boolean);
  const ok = r.status < 400;
  switch (r.entity) {
    case "auth":
      if (seg[1] === "login") return ok ? "Увійшов в адміністрування" : "Невдала спроба входу";
      if (seg[1] === "password") return ok ? "Змінив свій пароль" : "Спроба змінити пароль";
      break;
    case "orders":
      if (seg[1] === "bulk") {
        const ids = Array.isArray(d.ids) ? d.ids : [];
        return `Масово: ${ids.length} замовл. → ${ORDER_STATUS[str(d.status)] ?? str(d.status)}`;
      }
      if (seg[2] === "notes") return r.method === "DELETE" ? `Видалив нотатку в замовленні №${id}` : `Нотатка до замовлення №${id}: «${str(d.body).slice(0, 80)}»`;
      if (r.method === "PUT") {
        const parts = [];
        if (d.status) parts.push(`статус → ${ORDER_STATUS[str(d.status)] ?? str(d.status)}`);
        if (d.ttn) parts.push(`ТТН ${str(d.ttn)}`);
        return `Замовлення №${id}: ${parts.join(", ") || "зміни"}`;
      }
      break;
    case "books":
      if (seg[2] === "files") return `Завантажив файл до книги #${id}`;
      if (r.method === "POST") return `Створив книгу «${str(d.title)}»`;
      if (r.method === "DELETE") return `Видалив книгу #${id}`;
      if (r.method === "PUT") {
        const keys = Object.keys(d);
        return `Змінив книгу ${d.title ? `«${str(d.title)}»` : `#${id}`}${keys.length ? ` (${keys.slice(0, 5).join(", ")}${keys.length > 5 ? "…" : ""})` : ""}`;
      }
      break;
    case "files":
      return r.method === "DELETE" ? `Видалив файл #${id}` : `Змінив файл #${id}`;
    case "media":
      return "Завантажив зображення";
    case "content": {
      const v = d.values && typeof d.values === "object" ? Object.keys(d.values as object) : [];
      return `Змінив тексти сайту${v.length ? `: ${v.slice(0, 4).join(", ")}${v.length > 4 ? "…" : ""}` : ""}`;
    }
    case "submissions":
      return `Рукопис #${id} → ${SUBMISSION_STATUS[str(d.status)] ?? str(d.status)}`;
    case "promos":
      if (r.method === "POST") return `Створив промокод ${str(d.code).toUpperCase()}`;
      if (r.method === "PUT") return `Змінив промокод #${id}`;
      if (r.method === "DELETE") return `Видалив промокод #${id}`;
      break;
    case "team":
      if (seg[2] === "unlock") return `Розблокував адміністратора #${id}`;
      if (r.method === "POST") return `Додав адміністратора «${str(d.login)}»`;
      if (r.method === "DELETE") return `Видалив адміністратора #${id}`;
      break;
    case "sessions":
      return `Завершив сесію #${id}`;
  }
  return `${r.method} ${r.path}`;
}

function link(base: string, r: AuditRow) {
  if (!r.entity_id) return null;
  if (r.entity === "orders") return `${base}/orders?open=${r.entity_id}`;
  if (r.entity === "books") return `${base}/books?open=${r.entity_id}`;
  if (r.entity === "submissions") return `${base}/manuscripts?open=${r.entity_id}`;
  if (r.entity === "promos") return `${base}/promos`;
  return null;
}

export default function AuditPage() {
  const { token, base, fail } = useAdmin();
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [more, setMore] = useState(true);
  const [entity, setEntity] = useState("");
  const [admin, setAdmin] = useState("");
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(
    (before?: string) =>
      listAudit(token, { before, entity, admin, limit: 150 })
        .then((x) => {
          setRows((prev) => (before && prev ? [...prev, ...x] : x));
          setMore(x.length === 150);
          setError("");
        })
        .catch((e) => setError(fail(e))),
    [token, entity, admin, fail],
  );
  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  const admins = useMemo(() => [...new Set((rows ?? []).map((r) => r.admin_login).filter(Boolean))] as string[], [rows]);
  const shown = useMemo(() => (rows ?? []).filter((r) => !onlyFailed || r.status >= 400), [rows, onlyFailed]);

  let lastDay = "";
  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Журнал дій</h1>
          <p className={s.sub}>Хто, що й коли змінив в адмінці. Паролі й токени сюди не потрапляють.</p>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.toolbar}>
        <div className={s.row}>
          <select className={s.selectInline} value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="">Усі розділи</option>
            {Object.entries(ENTITIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select className={s.selectInline} value={admin} onChange={(e) => setAdmin(e.target.value)}>
            <option value="">Усі адміністратори</option>
            {[...new Set([admin, ...admins].filter(Boolean))].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <label className={s.check}>
            <input type="checkbox" checked={onlyFailed} onChange={(e) => setOnlyFailed(e.target.checked)} />
            Лише невдалі
          </label>
        </div>
      </div>

      <div className={s.tableWrap}>
        {rows === null ? (
          <div className={s.empty}>Завантаження…</div>
        ) : shown.length === 0 ? (
          <div className={s.empty}>Записів немає.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Час</th>
                <th>Хто</th>
                <th>Дія</th>
                <th className={s.hideSm}>Розділ</th>
                <th className={s.hideSm}>IP</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const day = new Date(r.created_at).toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" });
                const head = day !== lastDay;
                lastDay = day;
                const href = link(base, r);
                return (
                  <Fragment key={r.id}>
                    {head && (
                      <tr className={p.dayRow}>
                        <td colSpan={5}>{day}</td>
                      </tr>
                    )}
                    <tr className={s.rowLink} onClick={() => setOpen(open === r.id ? null : r.id)}>
                      <td className={`${s.num} ${s.dim}`}>
                        {new Date(r.created_at).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className={s.strong}>{r.admin_login || "–"}</td>
                      <td>
                        <span className={p.method + " " + (p[`m_${r.method}`] ?? "")}>{r.method}</span>{" "}
                        <span className={r.status >= 400 ? p.failed : ""}>{describe(r)}</span>
                        {r.status >= 400 && <span className={p.failed}> · помилка {r.status}</span>}
                        {href && (
                          <>
                            {" "}
                            <Link href={href} className={s.dim} onClick={(e) => e.stopPropagation()}>
                              відкрити →
                            </Link>
                          </>
                        )}
                        {open === r.id && r.details && <pre className={p.details}>{JSON.stringify(r.details, null, 2)}</pre>}
                      </td>
                      <td className={s.hideSm}>
                        <span className={s.dim}>{ENTITIES[r.entity ?? ""] ?? r.entity}</span>
                      </td>
                      <td className={`${s.hideSm} ${s.dim} ${s.num}`}>{r.ip}</td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {rows && more && (
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <button type="button" className={s.btn} onClick={() => load(rows[rows.length - 1]?.id)}>
            Показати давніші
          </button>
        </div>
      )}
    </>
  );
}
