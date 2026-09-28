"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon, useAdmin } from "@/components/admin/AdminShell";
import Drawer from "@/components/admin/Drawer";
import s from "@/components/admin/admin.module.css";
import p from "@/components/admin/plus.module.css";
import { uah, when } from "@/components/admin/labels";
import { createPromo, deletePromo, listPromos, updatePromo, type Promo, type PromoInput } from "@/lib/api";

const PLUS = "M12 5v14M5 12h14";

/** letters that survive being read out over the phone */
function genCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const r = crypto.getRandomValues(new Uint32Array(6));
  return "VDM-" + Array.from(r, (n) => abc[n % abc.length]).join("");
}

const local = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const iso = (v: string) => (v ? new Date(v).toISOString() : null);

function state(x: Promo): { label: string; cls: string } {
  const now = Date.now();
  if (!x.active) return { label: "Вимкнено", cls: s.s_cancelled };
  if (x.ends_at && new Date(x.ends_at).getTime() < now) return { label: "Минув", cls: s.s_cancelled };
  if (x.max_uses != null && x.used >= x.max_uses) return { label: "Вичерпано", cls: s.s_cancelled };
  if (x.starts_at && new Date(x.starts_at).getTime() > now) return { label: "Заплановано", cls: s.s_awaiting_payment };
  return { label: "Діє", cls: s.s_paid };
}

const discount = (x: Pick<Promo, "kind" | "value">) => (x.kind === "percent" ? `−${x.value}%` : `−${uah(x.value)}`);

function PromoDrawer({ promo, onClose, onSaved }: { promo: Promo | "new"; onClose: () => void; onSaved: () => void }) {
  const { token, fail } = useAdmin();
  const isNew = promo === "new";
  const [f, setF] = useState(() =>
    isNew
      ? { code: genCode(), kind: "percent" as const, value: "10", min_total: "", max_uses: "", starts: "", ends: "", active: true, note: "" }
      : {
          code: promo.code,
          kind: promo.kind,
          value: String(promo.kind === "fixed" ? promo.value / 100 : promo.value),
          min_total: promo.min_total_cents ? String(promo.min_total_cents / 100) : "",
          max_uses: promo.max_uses == null ? "" : String(promo.max_uses),
          starts: local(promo.starts_at),
          ends: local(promo.ends_at),
          active: promo.active,
          note: promo.note ?? "",
        },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  async function save() {
    setBusy(true);
    setError("");
    const body: PromoInput = {
      code: f.code,
      kind: f.kind,
      value: Number(f.value),
      min_total: Number(f.min_total) || 0,
      max_uses: f.max_uses === "" ? null : Number(f.max_uses),
      starts_at: iso(f.starts),
      ends_at: iso(f.ends),
      active: f.active,
      note: f.note,
    };
    try {
      if (isNew) await createPromo(token, body);
      else await updatePromo(token, promo.id, body);
      onSaved();
      onClose();
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  }

  const example = 1000_00;
  const ex = f.kind === "percent" ? Math.round((example * (Number(f.value) || 0)) / 100) : (Number(f.value) || 0) * 100;

  return (
    <Drawer
      title={isNew ? "Новий промокод" : promo.code}
      sub={isNew ? "Знижка на все замовлення, діє в кошику" : `створено ${when(promo.created_at)} · використано ${promo.used}`}
      onClose={onClose}
      foot={
        <button type="button" className={s.btnPrimary} disabled={busy || !f.code || !f.value} onClick={save}>
          {busy ? "Зберігаємо…" : isNew ? "Створити" : "Зберегти"}
        </button>
      }
    >
      {error && <p className={s.error}>{error}</p>}
      <div className={p.gen}>
        <label className={s.field} style={{ flex: 1 }}>
          <span>Код</span>
          <input
            value={f.code}
            disabled={!isNew}
            onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
            maxLength={32}
            style={{ fontFamily: "ui-monospace, monospace", letterSpacing: ".06em" }}
          />
        </label>
        {isNew && (
          <button type="button" className={s.btn} onClick={() => setF({ ...f, code: genCode() })}>
            Згенерувати
          </button>
        )}
      </div>
      <div className={s.formGrid}>
        <label className={s.field}>
          <span>Тип знижки</span>
          <select value={f.kind} onChange={set("kind")}>
            <option value="percent">Відсоток</option>
            <option value="fixed">Фіксована сума, грн</option>
          </select>
        </label>
        <label className={s.field}>
          <span>{f.kind === "percent" ? "Відсоток (1–90)" : "Сума, грн"}</span>
          <input type="number" min={1} max={f.kind === "percent" ? 90 : undefined} value={f.value} onChange={set("value")} />
        </label>
        <label className={s.field}>
          <span>Мінімальна сума замовлення, грн</span>
          <input type="number" min={0} value={f.min_total} placeholder="без обмеження" onChange={set("min_total")} />
        </label>
        <label className={s.field}>
          <span>Скільки разів можна використати</span>
          <input type="number" min={1} value={f.max_uses} placeholder="без обмеження" onChange={set("max_uses")} />
        </label>
        <label className={s.field}>
          <span>Діє з</span>
          <input type="datetime-local" value={f.starts} onChange={set("starts")} />
        </label>
        <label className={s.field}>
          <span>Діє до</span>
          <input type="datetime-local" value={f.ends} onChange={set("ends")} />
        </label>
      </div>
      <label className={s.field}>
        <span>Нотатка для команди</span>
        <textarea value={f.note} onChange={set("note")} placeholder="Для кого, звідки: розсилка, блогер, ярмарок…" rows={3} />
      </label>
      <label className={s.check}>
        <input type="checkbox" checked={f.active} onChange={set("active")} />
        Промокод увімкнено
      </label>
      <p className={s.dim} style={{ margin: 0 }}>
        Приклад: замовлення на {uah(example)} → знижка {uah(Math.min(ex, example - 100))}. Замовлення ніколи не стає безкоштовним, мінімум 1 грн лишається до сплати. Якщо замовлення скасувати, використання повертається.
      </p>
    </Drawer>
  );
}

export default function PromosPage() {
  const { token, fail } = useAdmin();
  const [rows, setRows] = useState<Promo[] | null>(null);
  const [open, setOpen] = useState<Promo | "new" | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [showOff, setShowOff] = useState(true);

  const load = useCallback(
    () =>
      listPromos(token)
        .then((x) => {
          setRows(x);
          setError("");
        })
        .catch((e) => setError(fail(e))),
    [token, fail],
  );
  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => (rows ?? []).filter((x) => showOff || state(x).label === "Діє" || state(x).label === "Заплановано"), [rows, showOff]);
  const totals = useMemo(
    () =>
      (rows ?? []).reduce(
        (a, x) => ({ given: a.given + Number(x.given_cents || 0), revenue: a.revenue + Number(x.revenue_cents || 0), orders: a.orders + (x.orders || 0) }),
        { given: 0, revenue: 0, orders: 0 },
      ),
    [rows],
  );

  async function remove(x: Promo) {
    if (!confirm(`Видалити промокод ${x.code}? Якщо ним уже користувались, він лише вимкнеться й лишиться у звітах.`)) return;
    try {
      await deletePromo(token, x.id);
      load();
    } catch (e) {
      setError(fail(e));
    }
  }

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Промокоди</h1>
          <p className={s.sub}>
            {rows ? `${rows.filter((x) => state(x).label === "Діє").length} діють · ${totals.orders} замовлень зі знижкою` : " "}
          </p>
        </div>
        <div className={s.headActions}>
          <label className={s.check}>
            <input type="checkbox" checked={showOff} onChange={(e) => setShowOff(e.target.checked)} />
            Показувати неактивні
          </label>
          <button type="button" className={s.btnPrimary} onClick={() => setOpen("new")}>
            <Icon d={PLUS} size={16} /> Новий промокод
          </button>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}

      {rows && rows.length > 0 && (
        <div className={s.kpis}>
          <div className={s.kpi}>
            <span className={s.kpiLabel}>Виручка з промокодами</span>
            <span className={s.kpiValue}>{uah(totals.revenue)}</span>
            <span className={s.kpiNote}>оплачені замовлення</span>
          </div>
          <div className={s.kpi}>
            <span className={s.kpiLabel}>Надано знижок</span>
            <span className={s.kpiValue}>{uah(totals.given)}</span>
            <span className={s.kpiNote}>{totals.revenue ? `${Math.round((totals.given / (totals.revenue + totals.given)) * 100)}% від ціни` : "–"}</span>
          </div>
          <div className={s.kpi}>
            <span className={s.kpiLabel}>Замовлень зі знижкою</span>
            <span className={s.kpiValue}>{totals.orders}</span>
            <span className={s.kpiNote}>разом зі скасованими</span>
          </div>
        </div>
      )}

      <div className={s.tableWrap}>
        {rows === null ? (
          <div className={s.empty}>Завантаження…</div>
        ) : shown.length === 0 ? (
          <div className={s.empty}>Промокодів ще немає. Створіть перший для розсилки чи блогера.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Код</th>
                <th>Знижка</th>
                <th className={s.hideSm}>Умови</th>
                <th>Використано</th>
                <th className={s.hideSm}>Період</th>
                <th className={`${s.right} ${s.hideSm}`}>Виручка</th>
                <th>Стан</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((x) => {
                const st = state(x);
                return (
                  <tr key={x.id} className={`${s.rowLink} ${st.label === "Діє" || st.label === "Заплановано" ? "" : p.off}`} onClick={() => setOpen(x)}>
                    <td>
                      <button
                        type="button"
                        className={p.codeBtn}
                        title="Скопіювати"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard?.writeText(x.code);
                          setCopied(x.code);
                          setTimeout(() => setCopied(""), 1400);
                        }}
                      >
                        <span className={p.code}>{x.code}</span>
                      </button>
                      <br />
                      <span className={s.dim}>{copied === x.code ? "скопійовано" : x.note || ""}</span>
                    </td>
                    <td className={s.strong}>{discount(x)}</td>
                    <td className={s.hideSm}>
                      <span className={s.dim}>{x.min_total_cents ? `від ${uah(x.min_total_cents)}` : "будь-яка сума"}</span>
                    </td>
                    <td>
                      <div className={p.usage}>
                        <span className={s.num}>
                          {x.used}
                          {x.max_uses != null ? ` / ${x.max_uses}` : ""}
                        </span>
                        {x.max_uses != null && (
                          <span className={p.usageBar}>
                            <span style={{ width: `${Math.min(100, (x.used / x.max_uses) * 100)}%` }} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={s.hideSm}>
                      <span className={s.dim}>
                        {x.starts_at || x.ends_at
                          ? `${x.starts_at ? when(x.starts_at, false) : "…"} – ${x.ends_at ? when(x.ends_at, false) : "…"}`
                          : "без обмеження"}
                      </span>
                    </td>
                    <td className={`${s.num} ${s.right} ${s.hideSm}`}>
                      {uah(x.revenue_cents ?? 0)}
                      <br />
                      <span className={s.dim}>−{uah(x.given_cents ?? 0)}</span>
                    </td>
                    <td>
                      <span className={`${s.pill} ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className={s.right}>
                      <button
                        type="button"
                        className={s.btnGhost}
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(x);
                        }}
                      >
                        Видалити
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {open && <PromoDrawer promo={open} onClose={() => setOpen(null)} onSaved={load} />}
    </>
  );
}
