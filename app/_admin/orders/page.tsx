"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BookCover from "@/components/BookCover";
import { Icon, useAdmin, NEW_ORDERS_EVENT } from "@/components/admin/AdminShell";
import Drawer from "@/components/admin/Drawer";
import s from "@/components/admin/admin.module.css";
import x from "@/components/admin/extra.module.css";
import p from "@/components/admin/plus.module.css";
import { useOpenRequest } from "@/components/admin/openRequest";
import { ORDER_FLOW, ORDER_STATUS, uah, when } from "@/components/admin/labels";
import {
  FORMAT_LABEL,
  addOrderNote,
  bulkOrderStatus,
  createTtn,
  emailPreviewUrl,
  npLabelUrl,
  npSync,
  orderEmails,
  sendOrderEmail,
  type EmailRow,
  type MailKind,
  deleteOrderNote,
  getAdminOrder,
  listAdminOrders,
  setOrderStatus,
  setOrderTtn,
  type AdminOrder,
  type AdminOrderDetail,
} from "@/lib/api";
import { PAY_INFO } from "@/lib/payments";

const SEARCH = "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4";
const DOWNLOAD = "M12 4v11M7 10l5 5 5-5M5 20h14";
const PRINT = "M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z";

/** what happened to the order, oldest first, in words */
function History({ o, onChange }: { o: AdminOrderDetail; onChange: () => void }) {
  const { token, fail } = useAdmin();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ev = o.events ?? [];
  const line = (e: AdminOrderDetail["events"][number]) => {
    if (e.kind === "status") return <>Статус: {ORDER_STATUS[e.from_value ?? ""] ?? e.from_value ?? "–"} → <b>{ORDER_STATUS[e.to_value ?? ""] ?? e.to_value}</b></>;
    if (e.kind === "ttn") return <>ТТН: <b className={s.num}>{e.to_value || "прибрано"}</b></>;
    return <>Нотатка</>;
  };
  const who = (x: string | null) => (x === "mono" ? "monobank" : x === "liqpay" ? "LiqPay" : x || "система");
  return (
    <div className={s.section}>
      <span className={s.sectionTitle}>Історія й нотатки</span>
      {error && <p className={s.error}>{error}</p>}
      <ul className={p.timeline}>
        <li className={p.ev}>
          <div className={p.evHead}>
            <span>Замовлення оформлено{o.promo_code ? ` з промокодом ${o.promo_code}` : ""}</span>
            <span className={p.evWhen}>{when(o.created_at)}</span>
          </div>
        </li>
        {ev.map((e) => (
          <li key={e.id} className={`${p.ev} ${e.kind === "note" ? p.evNote : ""}`}>
            <div className={p.evHead}>
              <span>{line(e)}</span>
              <span className={p.evWhen}>
                {when(e.created_at)} · {who(e.admin_login)}
              </span>
              {e.kind === "note" && (
                <button
                  type="button"
                  className={p.evDel}
                  onClick={async () => {
                    if (!confirm("Видалити нотатку?")) return;
                    try {
                      await deleteOrderNote(token, o.id, e.id);
                      onChange();
                    } catch (err) {
                      setError(fail(err));
                    }
                  }}
                >
                  видалити
                </button>
              )}
            </div>
            {e.body && <div className={p.evBody}>{e.body}</div>}
          </li>
        ))}
      </ul>
      <form
        className={p.noteForm}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!note.trim()) return;
          setBusy(true);
          try {
            await addOrderNote(token, o.id, note.trim());
            setNote("");
            onChange();
          } catch (err) {
            setError(fail(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className={s.field}>
          <span>Нотатка для команди (покупець її не бачить)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Дзвонили, просить відправити в понеділок…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.currentTarget.form as HTMLFormElement).requestSubmit();
            }}
          />
        </label>
        <button type="submit" className={s.btn} disabled={busy || !note.trim()} style={{ alignSelf: "flex-start" }}>
          Додати нотатку
        </button>
      </form>
    </div>
  );
}

/** Nova Poshta for one order: make the TTN, print the label, ask for the parcel's status */
function NpTools({ o, onChange }: { o: AdminOrderDetail; onChange: () => void }) {
  const { token, fail } = useAdmin();
  const [form, setForm] = useState(false);
  const [weight, setWeight] = useState("");
  const [cost, setCost] = useState(String(Math.round(o.total_cents / 100)));
  const [payer, setPayer] = useState<"Recipient" | "Sender">("Recipient");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const run = (fn: () => Promise<void>) => async () => {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      await fn();
      onChange();
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {o.np_status && (
        <span className={s.dim}>
          Нова пошта: <b style={{ color: "var(--a-text)" }}>{o.np_status}</b>
          {o.np_status_at && ` · перевірено ${when(o.np_status_at)}`}
        </span>
      )}
      {error && <p className={s.error}>{error}</p>}
      {msg && <p className={s.muted}>{msg}</p>}
      <div className={s.row}>
        {!o.ttn && !form && (
          <button type="button" className={s.btn} onClick={() => setForm(true)}>
            Створити ТТН
          </button>
        )}
        {o.ttn && (
          <>
            <a className={s.btn} href={npLabelUrl(o.ttn)} target="_blank" rel="noopener noreferrer">
              <Icon d={PRINT} size={16} /> Етикетка 100×100
            </a>
            <button
              type="button"
              className={s.btnGhost}
              disabled={busy}
              onClick={run(async () => {
                const r = await npSync(token, [o.id]);
                setMsg(r.moved ? "Статус оновлено, замовлення переведено далі." : "Статус посилки оновлено.");
              })}
            >
              Оновити статус посилки
            </button>
          </>
        )}
      </div>
      {form && (
        <div className={s.formGrid}>
          <label className={s.field}>
            <span>Вага, кг (порожньо = за картками книг)</span>
            <input type="number" step="0.1" min="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="авто" />
          </label>
          <label className={s.field}>
            <span>Оголошена вартість, грн</span>
            <input type="number" min="1" value={cost} onChange={(e) => setCost(e.target.value)} />
          </label>
          <label className={s.field}>
            <span>Доставку оплачує</span>
            <select value={payer} onChange={(e) => setPayer(e.target.value as "Recipient" | "Sender")}>
              <option value="Recipient">Отримувач</option>
              <option value="Sender">Магазин</option>
            </select>
          </label>
          <div className={s.row} style={{ alignItems: "flex-end" }}>
            <button
              type="button"
              className={s.btnPrimary}
              disabled={busy}
              onClick={run(async () => {
                const r = await createTtn(token, o.id, { weight: Number(weight) || undefined, cost: Number(cost) || undefined, payer });
                setForm(false);
                setMsg(`ТТН ${r.ttn} створено${r.cost ? `, доставка ≈ ${r.cost} грн` : ""}${r.estimated ? `, прибуде ${r.estimated}` : ""}.`);
              })}
            >
              {busy ? "Створюємо…" : "Створити"}
            </button>
            <button type="button" className={s.btnGhost} onClick={() => setForm(false)}>
              Скасувати
            </button>
          </div>
          {o.payment_method === "cod" && !o.paid_at && <span className={`${s.dim} ${s.span2}`}>Накладений платіж на {uah(o.total_cents)} додасться до ТТН.</span>}
        </div>
      )}
    </>
  );
}

const MAIL_LABEL: Record<EmailRow["status"], string> = { sent: "надіслано", failed: "помилка", skipped: "не надіслано" };

/** letters this buyer got, and one more by hand */
function Letters({ o }: { o: AdminOrderDetail }) {
  const { token, fail } = useAdmin();
  const [log, setLog] = useState<EmailRow[] | null>(null);
  const [kinds, setKinds] = useState<Record<string, string>>({});
  const [kind, setKind] = useState<MailKind>("created");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      orderEmails(token, o.id)
        .then((x) => {
          setLog(x.log);
          setKinds(x.kinds);
        })
        .catch((e) => setError(fail(e))),
    [token, o.id, fail],
  );
  useEffect(() => {
    load();
  }, [load, o.status, o.ttn]);
  return (
    <div className={s.section}>
      <span className={s.sectionTitle}>Листи покупцю</span>
      {error && <p className={s.error}>{error}</p>}
      {log && log.length === 0 && <span className={s.dim}>Листів ще не було.</span>}
      {log && log.length > 0 && (
        <ul className={s.miniList}>
          {log.map((e) => (
            <li key={e.id} className={s.miniRow} style={{ gridTemplateColumns: "1fr auto" }}>
              <span className={s.ellipsis}>
                {e.subject}
                <br />
                <span className={s.dim}>
                  {when(e.created_at)} · {e.created_by}
                  {e.error ? ` · ${e.error}` : ""}
                </span>
              </span>
              <span className={`${s.pill} ${e.status === "sent" ? s.s_paid : e.status === "failed" ? s.s_cancelled : s.s_awaiting_payment}`}>
                {MAIL_LABEL[e.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className={s.row}>
        <select className={s.selectInline} value={kind} onChange={(e) => setKind(e.target.value as MailKind)}>
          {Object.entries(kinds).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <a className={s.btnGhost} href={emailPreviewUrl(o.id, kind)} target="_blank" rel="noopener noreferrer">
          Переглянути
        </a>
        <button
          type="button"
          className={s.btn}
          disabled={busy || !o.user_email}
          onClick={async () => {
            if (!confirm(`Надіслати лист «${kinds[kind]}» на ${o.user_email}?`)) return;
            setBusy(true);
            setError("");
            try {
              const r = await sendOrderEmail(token, o.id, kind);
              if (r.status !== "sent") setError(r.error || "лист не надіслано");
              load();
            } catch (e) {
              setError(fail(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          Надіслати
        </button>
      </div>
    </div>
  );
}

/** a sheet to put in the parcel: printed on its own, the admin hidden */
function Slip({ o }: { o: AdminOrderDetail }) {
  const sub = o.items.reduce((a, i) => a + i.price_cents * i.quantity, 0);
  return (
    <div className={p.slip}>
      <h1>ВІДЬМАР · Замовлення №{o.id}</h1>
      <div>{when(o.created_at)} · {o.payment_method ? PAY_INFO[o.payment_method]?.title : ""} · {ORDER_STATUS[o.status]}</div>
      <div className={p.slipGrid} style={{ marginTop: "6mm" }}>
        <div>
          <b>Отримувач</b>
          <br />
          {o.customer_name}
          <br />
          {o.customer_phone}
          <br />
          {o.user_email}
        </div>
        <div>
          <b>Нова пошта</b>
          <br />
          {o.np_city || "електронна доставка"}
          <br />
          {o.np_warehouse}
          <br />
          {o.ttn && <>ТТН {o.ttn}</>}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Артикул</th>
            <th>Назва</th>
            <th>Формат</th>
            <th className={p.r}>К-сть</th>
            <th className={p.r}>Сума</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i, k) => (
            <tr key={k}>
              <td>{i.sku}</td>
              <td>{i.title}</td>
              <td>{i.format ? FORMAT_LABEL[i.format] : ""}</td>
              <td className={p.r}>{i.quantity}</td>
              <td className={p.r}>{uah(i.price_cents * i.quantity)}</td>
            </tr>
          ))}
          {!!o.discount_cents && (
            <tr>
              <td colSpan={4}>Знижка {o.promo_code}</td>
              <td className={p.r}>−{uah(o.discount_cents)}</td>
            </tr>
          )}
          <tr>
            <td colSpan={4}>
              <b>Разом</b>
            </td>
            <td className={p.r}>
              <b>{uah(o.total_cents || sub)}</b>
            </td>
          </tr>
        </tbody>
      </table>
      {o.comment && <p>Коментар покупця: {o.comment}</p>}
      <p style={{ marginTop: "10mm" }}>Дякуємо, що читаєте з нами. vidmar.com.ua</p>
    </div>
  );
}

function csv(rows: AdminOrder[]) {
  const head = ["№", "Дата", "Статус", "Покупець", "Телефон", "Пошта", "Місто", "Відділення", "ТТН", "Оплата", "Промокод", "Знижка", "Сума", "Склад"];
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = rows.map((o) =>
    [
      o.id,
      new Date(o.created_at).toISOString().slice(0, 16).replace("T", " "),
      ORDER_STATUS[o.status] ?? o.status,
      o.customer_name,
      o.customer_phone,
      o.user_email,
      o.np_city,
      o.np_warehouse,
      o.ttn,
      o.payment_method ? PAY_INFO[o.payment_method]?.title : "",
      o.promo_code ?? "",
      ((o.discount_cents ?? 0) / 100).toFixed(2),
      (o.total_cents / 100).toFixed(2),
      (o.items ?? []).map((i) => `${i.sku ?? ""} ${i.title} ×${i.quantity}`).join("; "),
    ]
      .map(q)
      .join(","),
  );
  // BOM so Excel opens the Cyrillic as Cyrillic
  const blob = new Blob(["﻿" + [head.map(q).join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `vidmar-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** One buyer across orders: the phone's last ten digits, else the e-mail. */
function buyerKey(o: AdminOrder): string | null {
  const phone = (o.customer_phone ?? "").replace(/\D/g, "").slice(-10);
  if (phone.length === 10) return `p:${phone}`;
  const mail = (o.user_email ?? "").trim().toLowerCase();
  return mail ? `m:${mail}` : null;
}

const PERIODS = [
  ["all", "Увесь час"],
  ["today", "Сьогодні"],
  ["7", "7 днів"],
  ["30", "30 днів"],
] as const;
type Period = (typeof PERIODS)[number][0];
function inPeriod(iso: string, period: Period) {
  if (period === "all") return true;
  const t = new Date(iso).getTime();
  if (period === "today") return new Date(iso).toDateString() === new Date().toDateString();
  return t > Date.now() - Number(period) * 86_400_000;
}

/** The buyer's other orders, newest first: who they are to the shop at a glance. */
function OtherOrders({ others, onOpen }: { others: AdminOrder[]; onOpen: (id: number) => void }) {
  if (!others.length) return null;
  const paid = others.filter((o) => ["paid", "shipped", "fulfilled"].includes(o.status));
  return (
    <div className={s.section}>
      <span className={s.sectionTitle}>
        Інші замовлення покупця · {others.length}
        {paid.length > 0 && ` · оплачено ${uah(paid.reduce((a, o) => a + o.total_cents, 0))}`}
      </span>
      <ul className={x.otherOrders}>
        {others.slice(0, 8).map((o) => (
          <li key={o.id}>
            <button type="button" className={x.otherOrder} onClick={() => onOpen(o.id)}>
              <span className={x.todoMain}>
                №{o.id} · {(o.items ?? []).map((i) => i.title).join(", ") || "–"}
              </span>
              <span className={`${s.pill} ${s[`s_${o.status}`]}`}>{ORDER_STATUS[o.status] ?? o.status}</span>
              <span className={`${s.num} ${s.dim}`}>{new Date(o.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "2-digit" })}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrderDrawer({
  id,
  onClose,
  onChanged,
  others = [],
  onOpen,
}: {
  id: number;
  onClose: () => void;
  onChanged: () => void;
  others?: AdminOrder[];
  onOpen?: (id: number) => void;
}) {
  const { token, fail, refreshCounts } = useAdmin();
  const [o, setO] = useState<AdminOrderDetail | null>(null);
  const [ttn, setTtn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      getAdminOrder(token, id)
        .then((x) => {
          setO(x);
          setTtn(x.ttn ?? "");
        })
        .catch((e) => setError(fail(e))),
    [token, id, fail],
  );

  useEffect(() => {
    load();
  }, [load]);

  async function status(next: string) {
    if (!o || next === o.status) return;
    if (next === "cancelled" && !confirm(`Скасувати замовлення №${o.id}? Паперові примірники повернуться на склад.`)) return;
    setBusy(true);
    try {
      await setOrderStatus(token, o.id, next);
      await load();
      onChanged();
      refreshCounts();
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveTtn() {
    if (!o) return;
    setBusy(true);
    try {
      await setOrderTtn(token, o.id, ttn);
      await load();
      onChanged();
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  }

  const link = o?.access_token ? `${window.location.origin}/order?id=${o.id}&t=${o.access_token}` : null;

  return (
    <Drawer
      title={o ? `Замовлення №${o.id}` : "Замовлення"}
      sub={o ? `${when(o.created_at)} · ${uah(o.total_cents)}` : undefined}
      onClose={onClose}
      foot={
        link && (
          <>
            <button type="button" className={s.btnGhost} onClick={() => window.print()}>
              <Icon d={PRINT} size={16} /> Накладна
            </button>
            <button type="button" className={s.btnGhost} onClick={() => navigator.clipboard?.writeText(link)}>
              Скопіювати посилання покупця
            </button>
            <a className={s.btn} href={link} target="_blank" rel="noopener noreferrer">
              Сторінка покупця
            </a>
          </>
        )
      }
    >
      {error && <p className={s.error}>{error}</p>}
      {!o ? (
        <p className={s.muted}>Завантаження…</p>
      ) : (
        <>
          <div className={s.section}>
            <span className={s.sectionTitle}>Статус</span>
            <div className={s.statusBtns}>
              {ORDER_FLOW.map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={busy}
                  className={`${s.statusBtn} ${o.status === k ? s.statusBtnOn : ""}`}
                  onClick={() => status(k)}
                >
                  {ORDER_STATUS[k]}
                </button>
              ))}
            </div>
            {o.paid_at && <span className={s.dim}>Оплачено {when(o.paid_at)}</span>}
          </div>

          <div className={s.section}>
            <span className={s.sectionTitle}>Покупець</span>
            <dl className={s.dl}>
              <dt>Імʼя</dt>
              <dd>{o.customer_name || "–"}</dd>
              <dt>Телефон</dt>
              <dd>{o.customer_phone ? <a href={`tel:${o.customer_phone.replace(/[^+\d]/g, "")}`}>{o.customer_phone}</a> : "–"}</dd>
              <dt>Пошта</dt>
              <dd>{o.user_email ? <a href={`mailto:${o.user_email}?subject=Замовлення №${o.id}`}>{o.user_email}</a> : "–"}</dd>
              {o.reader_code && (
                <>
                  <dt>Картка читача</dt>
                  <dd>
                    <span className={s.sku}>{o.reader_code}</span>
                  </dd>
                </>
              )}
              {o.comment && (
                <>
                  <dt>Коментар</dt>
                  <dd className={s.note}>{o.comment}</dd>
                </>
              )}
            </dl>
          </div>

          {onOpen && <OtherOrders others={others} onOpen={onOpen} />}

          {o.np_warehouse && (
            <div className={s.section}>
              <span className={s.sectionTitle}>Доставка · Нова пошта</span>
              <dl className={s.dl}>
                <dt>Місто</dt>
                <dd>{o.np_city}</dd>
                <dt>Відділення</dt>
                <dd>{o.np_warehouse}</dd>
              </dl>
              <div className={s.row}>
                <label className={s.field} style={{ flex: "1 1 200px" }}>
                  <span>ТТН</span>
                  <input value={ttn} inputMode="numeric" placeholder="20450000000000" onChange={(e) => setTtn(e.target.value)} />
                </label>
                <button
                  type="button"
                  className={s.btnPrimary}
                  style={{ alignSelf: "flex-end" }}
                  disabled={busy || ttn.trim() === (o.ttn ?? "")}
                  onClick={saveTtn}
                >
                  Зберегти ТТН
                </button>
                {o.ttn && (
                  <a
                    className={s.btn}
                    style={{ alignSelf: "flex-end" }}
                    href={`https://novaposhta.ua/tracking/?cargo_number=${o.ttn}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Відстежити
                  </a>
                )}
              </div>
              <NpTools o={o} onChange={() => (load(), onChanged())} />
            </div>
          )}

          <div className={s.section}>
            <span className={s.sectionTitle}>Склад</span>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <tbody>
                  {o.items.map((i, k) => (
                    <tr key={k}>
                      <td>
                        <span className={s.strong}>{i.title}</span>
                        <br />
                        <span className={s.dim}>{i.format ? FORMAT_LABEL[i.format] : ""}</span>
                      </td>
                      <td>{i.sku && <span className={s.sku}>{i.sku}</span>}</td>
                      <td className={`${s.num} ${s.right}`}>× {i.quantity}</td>
                      <td className={`${s.num} ${s.right}`}>{uah(i.price_cents * i.quantity)}</td>
                    </tr>
                  ))}
                  {!!o.discount_cents && (
                    <tr>
                      <td colSpan={3} className={s.muted}>
                        Знижка · промокод <b>{o.promo_code}</b>
                      </td>
                      <td className={`${s.num} ${s.right}`}>−{uah(o.discount_cents)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className={s.muted}>
                      Разом · {o.payment_method ? PAY_INFO[o.payment_method]?.title : ""}
                    </td>
                    <td className={`${s.num} ${s.right} ${s.strong}`}>{uah(o.total_cents)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className={s.section}>
            <span className={s.sectionTitle}>Онлайн-оплата</span>
            {o.payments.length === 0 ? (
              <span className={s.dim}>Спроб не було.</span>
            ) : (
              <ul className={s.miniList}>
                {o.payments.map((p) => (
                  <li key={p.provider_ref} className={s.miniRow} style={{ gridTemplateColumns: "1fr auto auto" }}>
                    <span className={s.ellipsis}>
                      {p.provider} · <span className={s.dim}>{p.provider_ref}</span>
                    </span>
                    <span className={s.num}>{uah(p.amount_cents)}</span>
                    <span className={s.dim}>{p.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Letters o={o} />
          <History o={o} onChange={load} />
          <Slip o={o} />
        </>
      )}
    </Drawer>
  );
}

export default function OrdersPage() {
  const { token, fail } = useAdmin();
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [hideDemo, setHideDemo] = useState(false);
  const [period, setPeriod] = useState<Period>("all");
  const [open, setOpen] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [bulk, setBulk] = useState("shipped");
  const [bulkBusy, setBulkBusy] = useState(false);
  const { refreshCounts } = useAdmin();

  const load = useCallback(
    () =>
      listAdminOrders(token)
        .then((x) => {
          setOrders(x);
          setError("");
        })
        .catch((e) => setError(fail(e))),
    [token, fail],
  );

  useEffect(() => {
    load();
    const st = new URLSearchParams(window.location.search).get("status");
    if (st && ORDER_STATUS[st]) setStatus(st);
  }, [load]);

  useOpenRequest("orders", orders !== null, setOpen);

  // the shell saw new orders arrive: show them without a reload
  useEffect(() => {
    const on = () => load();
    window.addEventListener(NEW_ORDERS_EVENT, on);
    return () => window.removeEventListener(NEW_ORDERS_EVENT, on);
  }, [load]);

  /* Every buyer's orders in time order, over the whole list (not just the
     filtered view), so "3-є" means the third order this buyer ever placed. */
  const byBuyer = useMemo(() => {
    const m = new Map<string, AdminOrder[]>();
    for (const o of orders ?? []) {
      if (o.is_demo) continue;
      const k = buyerKey(o);
      if (!k) continue;
      m.set(k, [...(m.get(k) ?? []), o]);
    }
    for (const list of m.values()) list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return m;
  }, [orders]);
  const nth = (o: AdminOrder) => {
    const k = buyerKey(o);
    const list = k ? byBuyer.get(k) : undefined;
    return list && list.length > 1 ? list.findIndex((y) => y.id === o.id) + 1 : 0;
  };
  const othersOf = (id: number) => {
    const o = orders?.find((y) => y.id === id);
    const k = o && buyerKey(o);
    return k ? (byBuyer.get(k) ?? []).filter((y) => y.id !== id).reverse() : [];
  };

  async function applyBulk() {
    const ids = [...picked];
    if (!ids.length) return;
    if (bulk === "cancelled" && !confirm(`Скасувати ${ids.length} замовл.? Паперові примірники повернуться на склад.`)) return;
    setBulkBusy(true);
    try {
      const r = await bulkOrderStatus(token, ids, bulk);
      setPicked(new Set());
      await load();
      refreshCounts();
      setError(r.changed === ids.length ? "" : `Змінено ${r.changed} з ${ids.length}`);
    } catch (e) {
      setError(fail(e));
    } finally {
      setBulkBusy(false);
    }
  }

  const base = useMemo(
    () => (orders ?? []).filter((o) => (!hideDemo || !o.is_demo) && inPeriod(o.created_at, period)),
    [orders, hideDemo, period],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: base.length };
    for (const o of base) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [base]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return base.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!n) return true;
      const hay = [
        o.id,
        o.customer_name,
        o.customer_phone?.replace(/\D/g, ""),
        o.customer_phone,
        o.user_email,
        o.ttn,
        o.reader_code,
        o.np_city,
        ...(o.items ?? []).flatMap((i) => [i.title, i.sku]),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(n) || hay.includes(n.replace(/\D/g, "") || "\u0000");
    });
  }, [base, status, q]);

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Замовлення</h1>
          <p className={s.sub}>
            {shown.length} з {base.length} · на {uah(shown.reduce((a, o) => a + o.total_cents, 0))}
          </p>
        </div>
        <div className={s.headActions}>
          <label className={s.check}>
            <input type="checkbox" checked={hideDemo} onChange={(e) => setHideDemo(e.target.checked)} />
            Сховати тестові
          </label>
          <button type="button" className={s.btn} onClick={() => csv(shown)} disabled={!shown.length}>
            <Icon d={DOWNLOAD} size={16} /> CSV
          </button>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.toolbar}>
        <div className={s.tabs} role="tablist">
          {["all", ...ORDER_FLOW].map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={status === k}
              className={`${s.tab} ${status === k ? s.tabOn : ""}`}
              onClick={() => setStatus(k)}
            >
              {k === "all" ? "Усі" : ORDER_STATUS[k]}
              <i>{counts[k] ?? 0}</i>
            </button>
          ))}
        </div>
        <div className={x.chips} role="group" aria-label="Період">
          {PERIODS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={period === k}
              className={`${x.chip} ${period === k ? x.chipOn : ""}`}
              onClick={() => setPeriod(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className={s.search}>
          <Icon d={SEARCH} size={16} />
          <input
            type="search"
            placeholder="№, імʼя, телефон, ТТН, артикул, код читача"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>

      <div className={s.tableWrap}>
        {orders === null ? (
          <div className={s.empty}>Завантаження…</div>
        ) : shown.length === 0 ? (
          <div className={s.empty}>Нічого не знайшлось.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th className={p.checkCell}>
                  <input
                    type="checkbox"
                    aria-label="Вибрати всі показані"
                    checked={shown.length > 0 && shown.every((o) => picked.has(o.id))}
                    onChange={(e) => setPicked(e.target.checked ? new Set(shown.map((o) => o.id)) : new Set())}
                  />
                </th>
                <th>№</th>
                <th>Покупець</th>
                <th className={s.hideSm}>Книги</th>
                <th className={s.hideSm}>Доставка</th>
                <th className={s.hideSm}>Оплата</th>
                <th className={s.right}>Сума</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => {
                const count = (o.items ?? []).reduce((a, i) => a + i.quantity, 0);
                return (
                  <tr
                    key={o.id}
                    className={`${s.rowLink} ${open === o.id ? s.rowOn : ""}`}
                    onClick={() => setOpen(o.id)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setOpen(o.id)}
                  >
                    <td className={p.checkCell} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Вибрати №${o.id}`}
                        checked={picked.has(o.id)}
                        onChange={(e) => {
                          const n = new Set(picked);
                          if (e.target.checked) n.add(o.id);
                          else n.delete(o.id);
                          setPicked(n);
                        }}
                      />
                    </td>
                    <td>
                      <span className={s.strong}>{o.id}</span>
                      <br />
                      <span className={`${s.dim} ${s.num}`}>
                        {new Date(o.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
                      </span>
                    </td>
                    <td>
                      <span className={s.strong}>{o.customer_name || "–"}</span>{" "}
                      {o.is_demo && <span className={s.tagDemo}>тест</span>}
                      {nth(o) > 1 && (
                        <span className={x.repeat} title="Цей покупець уже замовляв раніше">
                          {nth(o)}-е замовлення
                        </span>
                      )}
                      <br />
                      <span className={s.dim}>{o.customer_phone || o.user_email}</span>
                    </td>
                    <td className={s.hideSm}>
                      <span className={s.row} style={{ flexWrap: "nowrap" }}>
                        {(o.items ?? []).slice(0, 3).map((i, k) => (
                          <span key={k} className={s.thumb} style={{ width: 26 }}>
                            <BookCover title={i.title} src={i.cover_url} pos={i.cover_pos} size="small" />
                          </span>
                        ))}
                        <span className={s.dim}>{count} шт.</span>
                      </span>
                    </td>
                    <td className={s.hideSm}>
                      {o.np_city ? (
                        <>
                          {o.np_city}
                          <br />
                          <span className={s.dim}>{o.ttn ? (o.np_status ? o.np_status : `ТТН ${o.ttn}`) : "без ТТН"}</span>
                        </>
                      ) : (
                        <span className={s.dim}>електронна</span>
                      )}
                    </td>
                    <td className={s.hideSm}>{o.payment_method ? PAY_INFO[o.payment_method]?.title : "–"}</td>
                    <td className={`${s.num} ${s.right} ${s.strong}`}>{uah(o.total_cents)}</td>
                    <td>
                      <span className={`${s.pill} ${s[`s_${o.status}`]}`}>{ORDER_STATUS[o.status] ?? o.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {picked.size > 0 && (
        <div className={p.bulkBar}>
          <span className={s.strong}>Вибрано: {picked.size}</span>
          <span className={s.dim}>на {uah((orders ?? []).filter((o) => picked.has(o.id)).reduce((a, o) => a + o.total_cents, 0))}</span>
          <span style={{ flex: 1 }} />
          <select className={s.selectInline} value={bulk} onChange={(e) => setBulk(e.target.value)}>
            {ORDER_FLOW.map((k) => (
              <option key={k} value={k}>
                → {ORDER_STATUS[k]}
              </option>
            ))}
          </select>
          <button type="button" className={s.btnPrimary} disabled={bulkBusy} onClick={applyBulk}>
            {bulkBusy ? "Змінюємо…" : "Змінити статус"}
          </button>
          <button type="button" className={s.btn} onClick={() => csv((orders ?? []).filter((o) => picked.has(o.id)))}>
            CSV вибраних
          </button>
          <button type="button" className={s.btnGhost} onClick={() => setPicked(new Set())}>
            Зняти вибір
          </button>
        </div>
      )}

      {open != null && (
        <OrderDrawer
          key={open}
          id={open}
          onClose={() => setOpen(null)}
          onChanged={load}
          others={othersOf(open)}
          onOpen={setOpen}
        />
      )}
    </>
  );
}
