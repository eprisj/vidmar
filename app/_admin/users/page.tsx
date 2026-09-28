"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon, useAdmin } from "@/components/admin/AdminShell";
import Drawer from "@/components/admin/Drawer";
import s from "@/components/admin/admin.module.css";
import { ORDER_STATUS, uah, when } from "@/components/admin/labels";
import { useOpenRequest } from "@/components/admin/openRequest";
import { getAdminUser, listAdminUsers, type AdminUser, type AdminUserCard } from "@/lib/api";

const SEARCH = "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4";
const DOWNLOAD = "M12 4v11M7 10l5 5 5-5M5 20h14";

function csv(rows: AdminUser[]) {
  const head = ["Імʼя", "Пошта", "Телефон", "Картка", "Місто", "Відділення", "Розсилка", "Замовлень", "Сплачено", "Останнє замовлення", "Зареєстровано"];
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = rows.map((u) =>
    [
      u.name,
      u.email,
      u.phone,
      u.reader_code,
      u.np_city,
      u.np_warehouse,
      u.newsletter ? "так" : "",
      u.orders,
      (u.spent_cents / 100).toFixed(2),
      u.last_order_at ? u.last_order_at.slice(0, 10) : "",
      u.created_at.slice(0, 10),
    ]
      .map(q)
      .join(","),
  );
  const blob = new Blob(["\ufeff" + [head.map(q).join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `vidmar-readers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** one reader: profile and every order, account or guest with the same email */
function ReaderDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const { token, base, fail } = useAdmin();
  const [u, setU] = useState<AdminUserCard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getAdminUser(token, id)
      .then(setU)
      .catch((e) => setError(fail(e)));
  }, [token, id, fail]);
  const paid = (u?.orders ?? []).filter((o) => ["paid", "shipped", "fulfilled"].includes(o.status));
  const spent = paid.reduce((a, o) => a + o.total_cents, 0);
  return (
    <Drawer
      title={u ? u.name || u.email : "Читач"}
      sub={u ? `з нами з ${when(u.created_at, false)}${u.google ? " · вхід через Google" : ""}` : undefined}
      onClose={onClose}
      foot={
        u && (
          <>
            <a className={s.btn} href={`mailto:${u.email}`}>
              Написати
            </a>
            {u.phone && (
              <a className={s.btnGhost} href={`tel:${u.phone.replace(/[^+\d]/g, "")}`}>
                Подзвонити
              </a>
            )}
          </>
        )
      }
    >
      {error && <p className={s.error}>{error}</p>}
      {!u ? (
        <p className={s.muted}>Завантаження…</p>
      ) : (
        <>
          <div className={s.kpis} style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <div className={s.kpi}>
              <span className={s.kpiLabel}>Замовлень</span>
              <span className={s.kpiValue}>{u.orders.length}</span>
            </div>
            <div className={s.kpi}>
              <span className={s.kpiLabel}>Сплачено</span>
              <span className={s.kpiValue}>{uah(spent)}</span>
            </div>
            <div className={s.kpi}>
              <span className={s.kpiLabel}>Середній чек</span>
              <span className={s.kpiValue}>{paid.length ? uah(spent / paid.length) : "–"}</span>
            </div>
          </div>
          <div className={s.section}>
            <span className={s.sectionTitle}>Профіль</span>
            <dl className={s.dl}>
              <dt>Пошта</dt>
              <dd>{u.email}</dd>
              <dt>Телефон</dt>
              <dd>{u.phone || "–"}</dd>
              <dt>Картка читача</dt>
              <dd>{u.reader_code ? <span className={s.sku}>{u.reader_code}</span> : "–"}</dd>
              <dt>Доставка</dt>
              <dd>{u.np_city ? `${u.np_city}, ${u.np_warehouse ?? ""}` : "–"}</dd>
              <dt>Розсилка</dt>
              <dd>{u.newsletter ? "підписаний" : "ні"}</dd>
            </dl>
          </div>
          <div className={s.section}>
            <span className={s.sectionTitle}>Замовлення</span>
            {u.orders.length === 0 ? (
              <span className={s.dim}>Ще нічого не замовляв.</span>
            ) : (
              <ul className={s.miniList}>
                {u.orders.map((o) => (
                  <li key={o.id} className={s.miniRow} style={{ gridTemplateColumns: "1fr auto auto" }}>
                    <Link href={`${base}/orders?open=${o.id}`} className={s.ellipsis}>
                      <span className={s.strong}>№{o.id}</span> <span className={s.dim}>{when(o.created_at, false)}</span>
                      <br />
                      <span className={s.dim}>{o.titles}</span>
                    </Link>
                    <span className={s.num}>{uah(o.total_cents)}</span>
                    <span className={`${s.pill} ${s[`s_${o.status}`]}`}>{ORDER_STATUS[o.status] ?? o.status}</span>
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

export default function UsersPage() {
  const { token, fail } = useAdmin();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [buyers, setBuyers] = useState(false);

  useEffect(() => {
    listAdminUsers(token)
      .then(setUsers)
      .catch((e) => setError(fail(e)));
  }, [token, fail]);

  useOpenRequest("users", users !== null, setOpen);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    // a reader card is typed with or without its dashes
    const bare = n.replace(/[^a-z0-9]/g, "");
    return (users ?? []).filter(
      (u) =>
        (!buyers || u.orders > 0) &&
        (!n ||
        [u.email, u.name, u.phone, u.np_city].join(" ").toLowerCase().includes(n) ||
          (bare.length >= 3 && (u.reader_code ?? "").toLowerCase().replace(/-/g, "").includes(bare))),
    );
  }, [users, q, buyers]);

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Читачі</h1>
          <p className={s.sub}>
            {users?.length ?? 0} з акаунтом · {users?.filter((u) => u.orders > 0).length ?? 0} купували
          </p>
        </div>
        <div className={s.headActions}>
          <label className={s.check}>
            <input type="checkbox" checked={buyers} onChange={(e) => setBuyers(e.target.checked)} />
            Лише покупці
          </label>
          <button type="button" className={s.btn} onClick={() => csv(shown)} disabled={!shown.length}>
            <Icon d={DOWNLOAD} size={16} /> CSV
          </button>
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
                <tr key={u.id} className={s.rowLink} onClick={() => setOpen(u.id)}>
                  <td>
                    <span className={s.strong}>{u.name || "–"}</span>
                    <br />
                    <span className={s.dim}>{u.email}</span>
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
      {open != null && <ReaderDrawer id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
