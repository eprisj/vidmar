"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BookCover from "@/components/BookCover";
import { NEW_ORDERS_EVENT, useAdmin } from "@/components/admin/AdminShell";
import s from "@/components/admin/admin.module.css";
import x from "@/components/admin/extra.module.css";
import { ORDER_FLOW, ORDER_STATUS, uah } from "@/components/admin/labels";
import { getAdminStats, getAttention, type AdminStats, type Attention, type AttentionOrder } from "@/lib/api";

/** "+12%" against the 30 days before; nothing when there is nothing to compare. */
function Delta({ now, before }: { now: number; before: number }) {
  if (!before) return null;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className={x.delta}>як і раніше</span>;
  return (
    <span className={`${x.delta} ${pct > 0 ? x.deltaUp : x.deltaDown}`} title="Порівняно з попередніми 30 днями">
      {pct > 0 ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

const days = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
const age = (iso: string) => {
  const d = days(iso);
  if (d >= 1) return `${d} дн.`;
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return h >= 1 ? `${h} год.` : "щойно";
};

/** Today's to-do: every column is a question the team would otherwise answer by
 * scrolling the orders table. A column with nothing to do is not drawn. */
function NeedsAttention({ a, base }: { a: Attention; base: string }) {
  // `since` is what the age counts from: the order date, or for a parcel its last tracking change
  const orderRow = (o: AttentionOrder, lateAfter: number, note?: string, since = o.created_at) => (
    <li key={o.id}>
      <Link href={`${base}/orders?open=${o.id}`} className={x.todoRow}>
        <span className={x.todoMain}>
          №{o.id} · {o.customer_name || "без імені"} · {uah(o.total_cents)}
          {note && <span className={s.dim}> · {note}</span>}
        </span>
        <span className={`${x.todoAge} ${days(since) >= lateAfter ? x.todoAgeLate : ""}`}>{age(since)}</span>
      </Link>
    </li>
  );
  const cols = [
    {
      key: "to_ship",
      title: "Відправити",
      hint: "Оплачені або з накладеним платежем, ще без ТТН",
      g: a.to_ship,
      bad: a.to_ship.rows.some((o) => days(o.created_at) >= 2),
      more: `${base}/orders?status=paid`,
      rows: a.to_ship.rows.map((o) => orderRow(o, 2, o.payment_method === "cod" ? "накладений" : undefined)),
    },
    {
      key: "parcels",
      title: "Посилки з проблемою",
      hint: "Відмова, повернення або лежить у відділенні понад 5 днів",
      g: a.parcels,
      bad: a.parcels.rows.some((o) => o.trouble),
      more: `${base}/orders?status=shipped`,
      rows: a.parcels.rows.map((o) => orderRow(o, 5, o.np_status || undefined, o.np_status_at ?? o.created_at)),
    },
    {
      key: "stale_payment",
      title: "Не оплатили за 3 дні",
      hint: "Нагадати покупцеві або скасувати й повернути книги на склад",
      g: a.stale_payment,
      bad: false,
      more: `${base}/orders?status=awaiting_payment`,
      rows: a.stale_payment.rows.map((o) => orderRow(o, 7)),
    },
    {
      key: "manuscripts",
      title: "Рукописи без відповіді",
      hint: "Надійшли понад тиждень тому, досі «Новий»",
      g: a.manuscripts,
      bad: false,
      more: `${base}/manuscripts`,
      rows: a.manuscripts.rows.map((m) => (
        <li key={m.id}>
          <Link href={`${base}/manuscripts?open=${m.id}`} className={x.todoRow}>
            <span className={x.todoMain}>
              «{m.title || "Без назви"}» · {m.name}
            </span>
            <span className={`${x.todoAge} ${x.todoAgeLate}`}>{age(m.created_at)}</span>
          </Link>
        </li>
      )),
    },
    {
      key: "sold_out",
      title: "Розпродано",
      hint: "У каталозі, паперова продається, залишок 0",
      g: a.sold_out,
      bad: false,
      more: `${base}/books`,
      rows: a.sold_out.rows.map((b) => (
        <li key={b.id}>
          <Link href={`${base}/books?open=${b.id}`} className={x.todoRow}>
            <span className={x.todoMain}>{b.title}</span>
            {b.sku && <span className={x.todoAge}>{b.sku}</span>}
          </Link>
        </li>
      )),
    },
  ].filter((c) => c.g.total > 0);

  return (
    <section className={`${s.panel} ${x.todo}`}>
      <div className={s.panelHead}>
        <h2 className={s.h2}>Потребує уваги</h2>
        <span className={s.dim}>без тестових замовлень</span>
      </div>
      {cols.length === 0 ? (
        <div className={x.allClear}>✓ Усе оброблено: нічого не чекає на відправку, оплату чи відповідь.</div>
      ) : (
        <div className={x.todoGrid}>
          {cols.map((c) => (
            <div key={c.key} className={x.todoCol}>
              <div className={x.todoHead}>
                <span className={x.todoTitle}>{c.title}</span>
                <span className={`${x.todoCount} ${c.bad ? x.todoCountBad : ""}`}>{c.g.total}</span>
              </div>
              <p className={x.todoHint}>{c.hint}</p>
              <ul className={x.todoList}>{c.rows}</ul>
              {c.g.total > c.rows.length && (
                <Link href={c.more} className={x.todoMore}>
                  ще {c.g.total - c.rows.length} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Revenue per day for 30 days: one series, one hue, the title names it. */
function RevenueChart({ days }: { days: AdminStats["days"] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (days.every((d) => Number(d.revenue) === 0)) {
    return <div className={s.empty}>За 30 днів оплачених замовлень не було.</div>;
  }
  const W = 720;
  const H = 220;
  const pad = { l: 44, r: 6, t: 10, b: 24 };
  const vals = days.map((d) => Number(d.revenue) / 100);
  const max = Math.max(...vals, 100);
  // round the top of the scale to a readable step
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const bw = (W - pad.l - pad.r) / days.length;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / top);
  const ticks = [0, top / 2, top];
  const fmt = (v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(Math.round(v)));

  return (
    <div className={s.chart} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Виручка по днях за 30 днів">
        {ticks.map((t) => (
          <g key={t}>
            <line className={s.gridLine} x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
            <text className={s.axis} x={pad.l - 8} y={y(t) + 4} textAnchor="end">
              {fmt(t)}
            </text>
          </g>
        ))}
        <g className={s.bars}>
          {days.map((d, i) => {
            const v = vals[i];
            const x = pad.l + i * bw + 1;
            const w = Math.max(2, bw - 3);
            const h = Math.max(0, y(0) - y(v));
            const r = Math.min(4, w / 2, h);
            return (
              <g key={d.day} className={hover === i ? s.barOn : ""} onMouseEnter={() => setHover(i)}>
                {h > 0 && (
                  <path
                    className={s.bar}
                    d={`M${x},${y(0)} v${-(h - r)} q0,${-r} ${r},${-r} h${w - 2 * r} q${r},0 ${r},${r} v${h - r} z`}
                  />
                )}
                <rect className={s.barHit} x={x - 1} y={pad.t} width={bw} height={H - pad.t - pad.b} />
              </g>
            );
          })}
        </g>
        {[0, Math.floor(days.length / 2), days.length - 1].map((i) => (
          <text key={i} className={s.axis} x={pad.l + i * bw + bw / 2} y={H - 6} textAnchor="middle">
            {new Date(days[i].day).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
          </text>
        ))}
      </svg>
      {hover != null && (
        <div className={s.tip} style={{ left: `${((pad.l + hover * bw + bw / 2) / W) * 100}%` }}>
          <span className={s.dim}>
            {new Date(days[hover].day).toLocaleDateString("uk-UA", { weekday: "short", day: "numeric", month: "long" })}
          </span>
          <b className={s.num}>{uah(days[hover].revenue)}</b>
          <span className={s.dim}>{days[hover].orders} замовл.</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { token, base, fail } = useAdmin();
  const [demo, setDemo] = useState(false);
  const [st, setSt] = useState<AdminStats | null>(null);
  const [todo, setTodo] = useState<Attention | null>(null);
  const [error, setError] = useState("");

  // a new order changes both the to-do and the numbers: reload them when the shell hears one
  const [fresh, setFresh] = useState(0);
  useEffect(() => {
    const on = () => setFresh((n) => n + 1);
    window.addEventListener(NEW_ORDERS_EVENT, on);
    return () => window.removeEventListener(NEW_ORDERS_EVENT, on);
  }, []);

  useEffect(() => {
    getAttention(token)
      .then(setTodo)
      .catch((e) => setError(fail(e)));
  }, [token, fail, fresh]);

  useEffect(() => {
    getAdminStats(token, demo)
      .then((x) => {
        setSt(x);
        setError("");
      })
      .catch((e) => setError(fail(e)));
  }, [token, demo, fail, fresh]);

  const totalOrders = useMemo(() => (st ? Object.values(st.by_status).reduce((a, b) => a + b, 0) : 0), [st]);

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Огляд</h1>
          <p className={s.sub}>
            {new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <label className={s.check}>
          <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
          Враховувати тестові замовлення
        </label>
      </div>

      {error && <p className={s.error}>{error}</p>}

      {todo && <NeedsAttention a={todo} base={base} />}

      {st && (
        <>
          <div className={s.kpis}>
            <div className={s.kpi}>
              <span className={s.kpiLabel}>Виручка за 30 днів</span>
              <span className={s.kpiValue}>{uah(st.revenue_30)}</span>
              <span className={s.kpiNote}>
                <Delta now={Number(st.revenue_30)} before={Number(st.revenue_prev30)} /> усього {uah(st.revenue)}
              </span>
            </div>
            <div className={s.kpi}>
              <span className={s.kpiLabel}>Замовлень за 30 днів</span>
              <span className={s.kpiValue}>{st.orders_30}</span>
              <span className={s.kpiNote}>
                <Delta now={st.orders_30} before={st.orders_prev30} /> сьогодні {st.orders_today}
              </span>
            </div>
            <Link href={`${base}/orders?status=awaiting_payment`} className={s.kpi}>
              <span className={s.kpiLabel}>Чекають оплати</span>
              <span className={s.kpiValue}>{st.by_status.awaiting_payment ?? 0}</span>
              <span className={s.kpiNote}>на {uah(st.awaiting_sum)}</span>
            </Link>
            <div className={s.kpi}>
              <span className={s.kpiLabel}>Середній чек</span>
              <span className={s.kpiValue}>{st.paid_orders ? uah(Number(st.revenue) / st.paid_orders) : "–"}</span>
              <span className={s.kpiNote}>{st.paid_orders} оплачених</span>
            </div>
          </div>

          <div className={s.grid2}>
            <section className={s.panel}>
              <div className={s.panelHead}>
                <h2 className={s.h2}>Виручка по днях</h2>
                <span className={s.dim}>оплачені, 30 днів</span>
              </div>
              <RevenueChart days={st.days} />
            </section>

            <section className={s.panel}>
              <div className={s.panelHead}>
                <h2 className={s.h2}>Замовлення за статусом</h2>
                <Link href={`${base}/orders`} className={s.btnGhost}>
                  Усі
                </Link>
              </div>
              <div className={`${s.panelBody} ${s.statusList}`}>
                {ORDER_FLOW.map((k) => {
                  const n = st.by_status[k] ?? 0;
                  return (
                    <Link key={k} href={`${base}/orders?status=${k}`} className={s.statusRow}>
                      <span className={`${s.pill} ${s[`s_${k}`]}`}>{ORDER_STATUS[k]}</span>
                      <span className={s.meter}>
                        <span style={{ width: `${totalOrders ? (n / totalOrders) * 100 : 0}%` }} />
                      </span>
                      <span className={`${s.num} ${s.right}`}>{n}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          <div className={s.grid2}>
            <section className={s.panel}>
              <div className={s.panelHead}>
                <h2 className={s.h2}>Продаються найкраще</h2>
                <span className={s.dim}>примірників</span>
              </div>
              <div className={s.panelBody}>
                {st.top.length === 0 ? (
                  <p className={s.muted} style={{ margin: 0 }}>
                    Оплачених продажів ще немає.
                  </p>
                ) : (
                  <ul className={s.miniList}>
                    {st.top.map((b) => (
                      <li key={b.id} className={s.miniRow}>
                        <span className={s.thumb}>
                          <BookCover title={b.title} src={b.cover_url} pos={b.cover_pos} size="small" />
                        </span>
                        <span className={s.ellipsis}>
                          <span className={s.strong}>{b.title}</span>
                          <br />
                          <span className={s.dim}>{uah(b.revenue)}</span>
                        </span>
                        <span className={s.num}>{b.sold}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className={s.panel}>
              <div className={s.panelHead}>
                <h2 className={s.h2}>Закінчуються</h2>
                <Link href={`${base}/books`} className={s.btnGhost}>
                  Склад
                </Link>
              </div>
              <div className={s.panelBody}>
                {st.low_stock.length === 0 ? (
                  <p className={s.muted} style={{ margin: 0 }}>
                    Усього вистачає.
                  </p>
                ) : (
                  <ul className={s.miniList}>
                    {st.low_stock.map((b) => (
                      <li key={b.id} className={s.miniRow}>
                        <span className={s.thumb}>
                          <BookCover title={b.title} src={b.cover_url} pos={b.cover_pos} size="small" />
                        </span>
                        <span className={s.ellipsis}>
                          <span className={s.strong}>{b.title}</span>
                          <br />
                          {b.sku && <span className={s.sku}>{b.sku}</span>}
                        </span>
                        <span className={`${s.pill} ${b.stock === 0 ? s.s_cancelled : s.s_awaiting_payment}`}>
                          {b.stock === 0 ? "немає" : `${b.stock} шт.`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <div className={s.kpis}>
            <Link href={`${base}/users`} className={s.kpi}>
              <span className={s.kpiLabel}>Читачів з акаунтом</span>
              <span className={s.kpiValue}>{st.users}</span>
            </Link>
            <Link href={`${base}/subscribers`} className={s.kpi}>
              <span className={s.kpiLabel}>Підписників</span>
              <span className={s.kpiValue}>{st.subscribers}</span>
            </Link>
            <Link href={`${base}/manuscripts`} className={s.kpi}>
              <span className={s.kpiLabel}>Рукописів</span>
              <span className={s.kpiValue}>{st.submissions}</span>
              <span className={s.kpiNote}>за тиждень {st.submissions_7}</span>
            </Link>
            <Link href={`${base}/books`} className={s.kpi}>
              <span className={s.kpiLabel}>Книг у каталозі</span>
              <span className={s.kpiValue}>{st.books_live}</span>
              <span className={s.kpiNote}>усього {st.books}</span>
            </Link>
          </div>
        </>
      )}
    </>
  );
}
