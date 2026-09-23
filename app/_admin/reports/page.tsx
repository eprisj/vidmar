"use client";

import { useMemo, useState } from "react";
import { Icon, useAdmin } from "@/components/admin/AdminShell";
import s from "@/components/admin/admin.module.css";
import c from "@/components/admin/content.module.css";
import { downloadReport, type ReportKind } from "@/lib/api";

const DOWNLOAD = "M12 4v11M7 10l5 5 5-5M5 20h14";

const iso = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Kyiv" });

function range(preset: string): [string, string] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "month":
      return [iso(new Date(y, m, 1)), iso(now)];
    case "last":
      return [iso(new Date(y, m - 1, 1)), iso(new Date(y, m, 0))];
    case "30":
      return [iso(new Date(now.getTime() - 29 * 864e5)), iso(now)];
    case "quarter":
      return [iso(new Date(y, Math.floor(m / 3) * 3, 1)), iso(now)];
    case "year":
      return [iso(new Date(y, 0, 1)), iso(now)];
    default:
      return [iso(new Date(2026, 0, 1)), iso(now)];
  }
}

const PRESETS = [
  { id: "month", label: "Цей місяць" },
  { id: "last", label: "Минулий місяць" },
  { id: "30", label: "30 днів" },
  { id: "quarter", label: "Квартал" },
  { id: "year", label: "Рік" },
  { id: "all", label: "Весь час" },
];

const REPORTS: { kind: ReportKind; title: string; text: string; period: boolean; demo?: boolean }[] = [
  {
    kind: "sales",
    title: "Продажі",
    text: "Виручка, середній чек, продані примірники, графік по днях, книги, статуси й способи оплати.",
    period: true,
    demo: true,
  },
  {
    kind: "orders",
    title: "Замовлення",
    text: "Кожне замовлення за період: покупець, місто, книги, оплата, статус, ТТН і сума.",
    period: true,
    demo: true,
  },
  {
    kind: "catalog",
    title: "Каталог і склад",
    text: "Усі книги з артикулами, цінами, залишками, продажами й файлами. Що закінчується.",
    period: false,
  },
  {
    kind: "readers",
    title: "Читачі й розсилка",
    text: "Скільки читачів і підписників, хто зареєструвався й підписався за період.",
    period: true,
  },
  {
    kind: "manuscripts",
    title: "Рукописи",
    text: "Рукописи, що надійшли за період, з авторами, напрямами й статусами розгляду.",
    period: true,
  },
];

export default function ReportsPage() {
  const { fail } = useAdmin();
  const [preset, setPreset] = useState("month");
  const [[from, to], setDates] = useState(() => range("month"));
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");

  const label = useMemo(() => {
    const f = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
    return `${f(from)} – ${f(to)}`;
  }, [from, to]);

  async function get(kind: ReportKind) {
    setBusy(kind);
    setError("");
    try {
      await downloadReport(kind, { from, to, demo });
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Звіти</h1>
          <p className={s.sub}>PDF за будь-який період · {label}</p>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.toolbar}>
        <div className={c.periods}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${s.tab} ${preset === p.id ? s.tabOn : ""}`}
              onClick={() => {
                setPreset(p.id);
                setDates(range(p.id));
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className={c.dates}>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => {
              setPreset("");
              setDates([e.target.value, to]);
            }}
            aria-label="Від"
          />
          –
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => {
              setPreset("");
              setDates([from, e.target.value]);
            }}
            aria-label="До"
          />
        </div>
        <label className={s.check}>
          <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
          Враховувати демо-замовлення
        </label>
      </div>

      <div className={c.reports}>
        {REPORTS.map((r) => (
          <div key={r.kind} className={c.report}>
            <span className={c.reportTag}>{r.period ? (r.demo && !demo ? "за період · без демо" : "за період") : "станом на зараз"}</span>
            <h2>{r.title}</h2>
            <p>{r.text}</p>
            <div className={c.btnRow}>
              <button type="button" className={s.btnPrimary} disabled={!!busy || !from || !to} onClick={() => get(r.kind)}>
                <Icon d={DOWNLOAD} size={16} />
                {busy === r.kind ? "Формуємо…" : "Завантажити PDF"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
