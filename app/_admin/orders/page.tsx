"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BookCover from "@/components/BookCover";
import { Icon, useAdmin } from "@/components/admin/AdminShell";
import Drawer from "@/components/admin/Drawer";
import s from "@/components/admin/admin.module.css";
import { ORDER_FLOW, ORDER_STATUS, uah, when } from "@/components/admin/labels";
import {
  FORMAT_LABEL,
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

function csv(rows: AdminOrder[]) {
  const head = ["№", "Дата", "Статус", "Покупець", "Телефон", "Пошта", "Місто", "Відділення", "ТТН", "Оплата", "Сума", "Склад"];
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

function OrderDrawer({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
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
  const [open, setOpen] = useState<number | null>(null);
  const [error, setError] = useState("");

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

  const base = useMemo(() => (orders ?? []).filter((o) => !hideDemo || !o.is_demo), [orders, hideDemo]);
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
                          <span className={s.dim}>{o.ttn ? `ТТН ${o.ttn}` : "без ТТН"}</span>
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

      {open != null && <OrderDrawer id={open} onClose={() => setOpen(null)} onChanged={load} />}
    </>
  );
}
