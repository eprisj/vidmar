"use client";

import { useEffect, useState } from "react";
import { ApiError, formatPrice, listAdminOrders, setOrderStatus, setOrderTtn, type AdminOrder } from "@/lib/api";

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
    await setOrderStatus(token, id, status);
    refresh();
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
        Оплата поки не автоматизована (немає зареєстрованої юрособи) – покупець
        отримує реквізити для переказу окремо, а статус тут виставляється вручну
        після підтвердження надходження.
      </p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {loading && <p>завантаження…</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th>#</th>
            <th>покупець</th>
            <th>доставка</th>
            <th>сума</th>
            <th>дата</th>
            <th>статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{o.id}</td>
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
              <td>{formatPrice(o.total_cents, o.currency)}</td>
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
          ))}
        </tbody>
      </table>
    </main>
  );
}
