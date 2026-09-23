"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, useAdmin } from "@/components/admin/AdminShell";
import s from "@/components/admin/admin.module.css";
import { uah, when } from "@/components/admin/labels";
import { listAdminUsers, type AdminUser } from "@/lib/api";

const SEARCH = "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4";

export default function UsersPage() {
  const { token, fail } = useAdmin();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listAdminUsers(token)
      .then(setUsers)
      .catch((e) => setError(fail(e)));
  }, [token, fail]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    // a reader card is typed with or without its dashes
    const bare = n.replace(/[^a-z0-9]/g, "");
    return (users ?? []).filter(
      (u) =>
        !n ||
        [u.email, u.name, u.phone, u.np_city].join(" ").toLowerCase().includes(n) ||
        (bare.length >= 3 && (u.reader_code ?? "").toLowerCase().replace(/-/g, "").includes(bare)),
    );
  }, [users, q]);

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Читачі</h1>
          <p className={s.sub}>
            {users?.length ?? 0} з акаунтом · {users?.filter((u) => u.orders > 0).length ?? 0} купували
          </p>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.toolbar}>
        <label className={s.search}>
          <Icon d={SEARCH} size={16} />
          <input type="search" placeholder="Пошта, імʼя, телефон або код картки VR-…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className={s.tableWrap}>
        {users === null ? (
          <div className={s.empty}>Завантаження…</div>
        ) : shown.length === 0 ? (
          <div className={s.empty}>Нікого не знайшлось.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Читач</th>
                <th>Картка</th>
                <th className={s.hideSm}>Телефон</th>
                <th className={s.hideSm}>Відділення</th>
                <th className={s.right}>Замовлень</th>
                <th className={s.right}>Сплачено</th>
                <th className={s.hideSm}>З нами з</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className={s.strong}>{u.name || "–"}</span>
                    <br />
                    <a className={s.dim} href={`mailto:${u.email}`}>
                      {u.email}
                    </a>
                    {u.newsletter && (
                      <>
                        {" "}
                        <span className={s.tagDemo}>розсилка</span>
                      </>
                    )}
                  </td>
                  <td>{u.reader_code && <span className={s.sku}>{u.reader_code}</span>}</td>
                  <td className={s.hideSm}>{u.phone || <span className={s.dim}>–</span>}</td>
                  <td className={s.hideSm}>
                    {u.np_city ? (
                      <>
                        {u.np_city}
                        <br />
                        <span className={s.dim}>{u.np_warehouse}</span>
                      </>
                    ) : (
                      <span className={s.dim}>–</span>
                    )}
                  </td>
                  <td className={`${s.num} ${s.right}`}>{u.orders}</td>
                  <td className={`${s.num} ${s.right}`}>{u.spent_cents ? uah(u.spent_cents) : "–"}</td>
                  <td className={`${s.hideSm} ${s.dim}`}>{when(u.created_at, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
