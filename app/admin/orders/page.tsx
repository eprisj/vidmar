"use client";

import { useEffect, useState } from "react";
import { Fragment } from "react";
import {
  ApiError,
  FORMAT_LABEL,
  formatPrice,
  getAdminOrder,
  listAdminOrders,
  setOrderStatus,
  setOrderTtn,
  type AdminOrder,
  type AdminOrderDetail,
} from "@/lib/api";
import { PAY_INFO } from "@/lib/payments";

const TOKEN_KEY = "vidmar-admin-token";
const STATUSES = ["awaiting_payment", "paid", "shipped", "fulfilled", "cancelled"];
const STATUS_UA: Record<string, string> = {
  awaiting_payment: "очікує оплати",
  paid: "оплачено",
  shipped: "відправлено",
  fulfilled: "виконано",
  cancelled: "скасовано",
};

export default function AdminOrdersPage() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<AdminOrderDetail | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!token) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function refresh() {
    setLoading(true);
    try {
      setOrders(await listAdminOrders(token));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "не вдалося завантажити");
      if (err instanceof ApiError) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: number, status: string) {
    if (status === "cancelled" && !confirm(`Скасувати замовлення №${id}? Паперові примірники повернуться на склад.`)) return;
    await setOrderStatus(token, id, status);
    refresh();
    if (open?.id === id) setOpen(await getAdminOrder(token, id));
  }

  async function toggle(id: number) {
    setOpen(open?.id === id ? null : await getAdminOrder(token, id));
  }

  if (!token) {
    return (
      <main style={{ padding: 40, maxWidth: 420, margin: "0 auto", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Адмін – вхід</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            localStorage.setItem(TOKEN_KEY, tokenInput);
            setToken(tokenInput);
          }}
          style={{ display: "flex", gap: 8 }}
        >
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="admin token"
            style={{ flex: 1, padding: 10 }}
          />
          <button type="submit" style={{ padding: "10px 16px" }}>
            Увійти
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, maxWidth: 1100, margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>Замовлення ({orders.length})</h1>
        <button
          onClick={() => {
            localStorage.removeItem(TOKEN_KEY);
            setToken("");
          }}
          style={{ padding: "6px 12px" }}
        >
          Вийти
        </button>
      </div>

      <p style={{ fontSize: 13, color: "#666", margin: "12px 0" }}>
        Картка (monobank) і Приват24 (LiqPay) самі переводять замовлення в «оплачено» за підписаним
        сповіщенням банку. Переказ на рахунок і накладений платіж звіряються вручну: статус тут.
        Скасування повертає паперові примірники на склад.
      </p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {loading && <p>завантаження…</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th>#</th>
            <th>покупець</th>
            <th>доставка</th>
            <th>сума / оплата</th>
            <th>дата</th>
            <th>статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <Fragment key={o.id}>
            <tr style={{ borderBottom: "1px solid #eee", background: open?.id === o.id ? "#faf6ec" : undefined }}>
              <td>
                <button onClick={() => toggle(o.id)} style={{ padding: "2px 8px" }} title="склад замовлення">
                  {open?.id === o.id ? "▾" : "▸"} {o.id}
                </button>
              </td>
              <td>
                {o.is_demo && <span style={{ color: "#a67c00" }}>демо · </span>}
                <b>{o.customer_name}</b>
                <br />
                {o.customer_phone} · {o.user_email}
                {o.comment && <div style={{ color: "#666" }}>«{o.comment}»</div>}
              </td>
              <td style={{ maxWidth: 220 }}>
                {o.np_warehouse ? (
                  <>
                    {o.np_city}, {o.np_warehouse}
                    <br />
                    <input
                      defaultValue={o.ttn ?? ""}
                      placeholder="ТТН"
                      inputMode="numeric"
                      style={{ padding: 4, width: 150, marginTop: 4 }}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== (o.ttn ?? "")) setOrderTtn(token, o.id, v).then(refresh);
                      }}
                    />
                  </>
                ) : (
                  "лише e-book"
                )}
              </td>
              <td>
                <b>{formatPrice(o.total_cents, o.currency)}</b>
                <br />
                <small>{o.payment_method ? PAY_INFO[o.payment_method]?.title ?? o.payment_method : ""}</small>
                {o.paid_at && (
                  <>
                    <br />
                    <small style={{ color: "#2a7a3a" }}>оплачено {new Date(o.paid_at).toLocaleString("uk-UA")}</small>
                  </>
                )}
              </td>
              <td>{new Date(o.created_at).toLocaleString("uk-UA")}</td>
              <td>
                <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} style={{ padding: 4 }}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_UA[s]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            {open?.id === o.id && (
              <tr style={{ background: "#faf6ec", borderBottom: "1px solid #ddd" }}>
                <td></td>
                <td colSpan={5} style={{ padding: "10px 0 16px" }}>
                  <table style={{ borderCollapse: "collapse", fontSize: 13, marginBottom: 10 }}>
                    <tbody>
                      {open.items.map((i, k) => (
                        <tr key={k}>
                          <td style={{ paddingRight: 16, fontFamily: "monospace" }}>{i.sku ?? "–"}</td>
                          <td style={{ paddingRight: 16 }}>{i.title}</td>
                          <td style={{ paddingRight: 16 }}>{i.format ? FORMAT_LABEL[i.format] : ""}</td>
                          <td style={{ paddingRight: 16 }}>× {i.quantity}</td>
                          <td>{formatPrice(i.price_cents * i.quantity, o.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {open.payments.length > 0 ? (
                    <div style={{ fontSize: 12, color: "#555" }}>
                      Спроби оплати:
                      {open.payments.map((p) => (
                        <div key={p.provider_ref}>
                          {new Date(p.created_at).toLocaleString("uk-UA")} · {p.provider} · {p.provider_ref} ·{" "}
                          {formatPrice(p.amount_cents, o.currency)} · <b>{p.status}</b>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#888" }}>Онлайн-оплат не було.</div>
                  )}
                </td>
              </tr>
            )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </main>
  );
}
