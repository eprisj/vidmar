"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import Drawer from "@/components/admin/Drawer";
import s from "@/components/admin/admin.module.css";
import x from "@/components/admin/extra.module.css";
import { useOpenRequest } from "@/components/admin/openRequest";
import { SUBMISSION_STATUS, when } from "@/components/admin/labels";
import { listSubmissions, saveSubmissionNote, setSubmissionStatus, type Submission } from "@/lib/api";
import { genres } from "@/lib/content";

const FLOW: Submission["status"][] = ["new", "reading", "accepted", "declined"];

/* Three letters the team writes again and again. They open in the mail app
   already filled in, to be read and adjusted before sending; nothing is sent
   from here. */
const REPLIES: { key: string; label: string; body: (name: string, title: string) => string }[] = [
  {
    key: "received",
    label: "Отримали, читаємо",
    body: (name, title) =>
      `Добрий день, ${name}!\n\nДякуємо, що надіслали нам рукопис «${title}». Ми його отримали й уважно прочитаємо: зазвичай це займає 6–8 тижнів. Відповімо в будь-якому разі.\n\nЗ повагою,\nредакція ВІДЬМАР`,
  },
  {
    key: "accepted",
    label: "Хочемо видати",
    body: (name, title) =>
      `Добрий день, ${name}!\n\nМи прочитали «${title}» і хочемо працювати з цим текстом. Розкажемо, як виглядає шлях до книжки: редагування, терміни, умови договору.\n\nКоли вам зручно поговорити цього чи наступного тижня?\n\nЗ повагою,\nредакція ВІДЬМАР`,
  },
  {
    key: "declined",
    label: "Відмова",
    body: (name, title) =>
      `Добрий день, ${name}!\n\nДякуємо за довіру і за рукопис «${title}». Ми уважно його прочитали, але зараз не зможемо взяти його до видання: наш план на найближчий рік уже складений, і цей текст у нього не вписується.\n\nЦе не оцінка вашого письма. Бажаємо рукопису знайти свого видавця.\n\nЗ повагою,\nредакція ВІДЬМАР`,
  },
];
const mailto = (r: Submission, body?: string) =>
  `mailto:${r.email}?subject=${encodeURIComponent(`Рукопис «${r.title || ""}» – ВІДЬМАР`)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;

/** The team's note on a manuscript: who read it, what they thought. */
function Note({ r, onSaved }: { r: Submission; onSaved: (r: Submission) => void }) {
  const { token, fail } = useAdmin();
  const [v, setV] = useState(r.admin_note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const changed = v.trim() !== (r.admin_note ?? "").trim();
  return (
    <div className={s.section}>
      <span className={s.sectionTitle}>Нотатка команди</span>
      <textarea
        className={x.noteArea}
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Хто читав, враження, що відповіли автору… Бачить лише команда."
      />
      {error && <p className={s.error}>{error}</p>}
      <div className={s.row}>
        <button
          type="button"
          className={s.btn}
          disabled={busy || !changed}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              onSaved(await saveSubmissionNote(token, r.id, v));
            } catch (e) {
              setError(fail(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Зберігаємо…" : "Зберегти нотатку"}
        </button>
        {r.admin_note_at && (
          <span className={x.noteMeta}>
            {r.admin_note_by} · {when(r.admin_note_at)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ManuscriptsPage() {
  const { token, fail, refreshCounts } = useAdmin();
  const [rows, setRows] = useState<Submission[] | null>(null);
  const [tab, setTab] = useState<"all" | Submission["status"]>("all");
  const [open, setOpen] = useState<Submission | null>(null);
  useOpenRequest("manuscripts", rows !== null, (id) => {
    const r = rows?.find((x) => x.id === id);
    if (r) setOpen(r);
  });
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      listSubmissions(token)
        .then((x) => setRows(x.map((r) => ({ ...r, status: r.status ?? "new" }))))
        .catch((e) => setError(fail(e))),
    [token, fail],
  );

  useEffect(() => {
    load();
  }, [load]);

  const all = rows ?? [];
  const shown = useMemo(() => (tab === "all" ? all : all.filter((r) => r.status === tab)), [all, tab]);

  async function move(r: Submission, status: Submission["status"]) {
    try {
      await setSubmissionStatus(token, r.id, status);
      setOpen((o) => (o && o.id === r.id ? { ...o, status } : o));
      load();
      refreshCounts();
    } catch (e) {
      setError(fail(e));
    }
  }

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Рукописи</h1>
          <p className={s.sub}>Заявки авторів з форми «Надіслати рукопис»</p>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.toolbar}>
        <div className={s.tabs} role="tablist">
          {(["all", ...FLOW] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={`${s.tab} ${tab === k ? s.tabOn : ""}`}
              onClick={() => setTab(k)}
            >
              {k === "all" ? "Усі" : SUBMISSION_STATUS[k]}
              <i>{k === "all" ? all.length : all.filter((r) => r.status === k).length}</i>
            </button>
          ))}
        </div>
      </div>

      <div className={s.tableWrap}>
        {rows === null ? (
          <div className={s.empty}>Завантаження…</div>
        ) : shown.length === 0 ? (
          <div className={s.empty}>Тут порожньо.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Рукопис</th>
                <th>Автор</th>
                <th className={s.hideSm}>Напрям</th>
                <th className={s.hideSm}>Надійшов</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className={s.rowLink} onClick={() => setOpen(r)}>
                  <td>
                    <span className={s.strong}>{r.title || "Без назви"}</span>
                    {r.admin_note && (
                      <span className={x.repeat} title={r.admin_note}>
                        нотатка
                      </span>
                    )}
                    <br />
                    <span className={s.dim}>{(r.note ?? "").slice(0, 80)}{(r.note ?? "").length > 80 ? "…" : ""}</span>
                  </td>
                  <td>
                    {r.name}
                    <br />
                    <span className={s.dim}>{r.email}</span>
                  </td>
                  <td className={s.hideSm}>{genres.find((g) => g.slug === r.genre)?.title ?? r.genre ?? "–"}</td>
                  <td className={`${s.hideSm} ${s.dim}`}>{when(r.created_at)}</td>
                  <td>
                    <span className={`${s.pill} ${s[`s_${r.status}`]}`}>{SUBMISSION_STATUS[r.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Drawer
          title={open.title || "Без назви"}
          sub={`${open.name} · ${when(open.created_at)}`}
          onClose={() => setOpen(null)}
          foot={
            <a className={s.btnPrimary} href={mailto(open)}>
              Відповісти автору
            </a>
          }
        >
          <div className={s.section}>
            <span className={s.sectionTitle}>Статус</span>
            <div className={s.statusBtns}>
              {FLOW.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`${s.statusBtn} ${open.status === k ? s.statusBtnOn : ""}`}
                  onClick={() => move(open, k)}
                >
                  {SUBMISSION_STATUS[k]}
                </button>
              ))}
            </div>
          </div>
          <div className={s.section}>
            <span className={s.sectionTitle}>Автор</span>
            <dl className={s.dl}>
              <dt>Імʼя</dt>
              <dd>{open.name}</dd>
              <dt>Пошта</dt>
              <dd>
                <a href={`mailto:${open.email}`}>{open.email}</a>
              </dd>
              <dt>Напрям</dt>
              <dd>{genres.find((g) => g.slug === open.genre)?.title ?? open.genre ?? "–"}</dd>
            </dl>
          </div>
          <div className={s.section}>
            <span className={s.sectionTitle}>Про рукопис</span>
            <div className={s.note}>{open.note || "–"}</div>
          </div>
          <Note
            key={open.id}
            r={open}
            onSaved={(r) => {
              setOpen((o) => (o && o.id === r.id ? { ...o, ...r } : o));
              setRows((all) => all && all.map((y) => (y.id === r.id ? { ...y, ...r } : y)));
            }}
          />
          <div className={s.section}>
            <span className={s.sectionTitle}>Відповідь автору · шаблон відкриється в пошті</span>
            <div className={x.templates}>
              {REPLIES.map((t) => (
                <a
                  key={t.key}
                  className={s.btnGhost}
                  href={mailto(open, t.body(open.name.split(" ")[0] || open.name, open.title || "без назви"))}
                >
                  {t.label}
                </a>
              ))}
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
}
