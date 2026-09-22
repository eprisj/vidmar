"use client";

import { useEffect, useState } from "react";
import { ApiError, listAdminUsers, type AdminUser } from "@/lib/api";

const TOKEN_KEY = "vidmar-admin-token";

export default function AdminUsersPage() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    listAdminUsers(token)
      .then((rows) => {
        setUsers(rows);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "не вдалося завантажити");
        if (err instanceof ApiError) {
          localStorage.removeItem(TOKEN_KEY);
          setToken("");
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

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
    <main style={{ padding: 40, maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>Користувачі ({users.length})</h1>
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

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {loading && <p>завантаження…</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 24 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th>id</th>
            <th>email</th>
            <th>ім'я</th>
            <th>реєстрація</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.name || "—"}</td>
              <td>{new Date(u.created_at).toLocaleString("uk-UA")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
