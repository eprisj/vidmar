"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon, useAdmin } from "@/components/admin/AdminShell";
import s from "@/components/admin/admin.module.css";
import c from "@/components/admin/content.module.css";
import { when } from "@/components/admin/labels";
import { contentHistory, getAdminContent, saveContent, type SavedText } from "@/lib/api";
import { TEXT_FIELDS, type TextField } from "@/lib/siteText";

type Value = string | string[] | Record<string, string>[];
/** a pending change: a new value, or null for "back to the built-in text" */
type Drafts = Record<string, Value | null>;

const SEARCH = "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4";
const EXT = "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5";
const UNDO = "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3";
const PLUS = "M12 5v14M5 12h14";
const X = "M6 6l12 12M18 6L6 18";
const UP = "M12 19V5M6 11l6-6 6 6";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function AutoText({ value, onChange, rows = 2, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      className={c.area}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onInput={(e) => {
        const t = e.currentTarget;
        t.style.height = "auto";
        t.style.height = `${t.scrollHeight + 2}px`;
      }}
      ref={(t) => {
        if (t) {
          t.style.height = "auto";
          t.style.height = `${t.scrollHeight + 2}px`;
        }
      }}
    />
  );
}

function Editor({ f, value, onChange }: { f: TextField; value: Value; onChange: (v: Value) => void }) {
  if (f.kind === "text")
    return (
      <input className={c.input} value={value as string} onChange={(e) => onChange(e.target.value)} placeholder={String(f.default)} />
    );
  if (f.kind === "long") return <AutoText value={value as string} onChange={onChange} placeholder={String(f.default)} />;

  if (f.kind === "list") {
    const list = value as string[];
    const setAt = (i: number, v: string) => onChange(list.map((x, j) => (j === i ? v : x)));
    return (
      <div className={c.list}>
        {list.map((item, i) => (
          <div key={i} className={c.item}>
            <span className={c.num}>{String(i + 1).padStart(2, "0")}</span>
            <AutoText value={item} onChange={(v) => setAt(i, v)} rows={1} />
            <div className={c.itemTools}>
              <button type="button" title="Вище" disabled={i === 0} onClick={() => { const n = [...list]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; onChange(n); }}>
                <Icon d={UP} size={14} />
              </button>
              <button type="button" title="Прибрати" disabled={list.length === 1} onClick={() => onChange(list.filter((_, j) => j !== i))}>
                <Icon d={X} size={14} />
              </button>
            </div>
          </div>
        ))}
        <button type="button" className={c.add} onClick={() => onChange([...list, ""])}>
          <Icon d={PLUS} size={14} /> Додати пункт
        </button>
      </div>
    );
  }

  const recs = value as Record<string, string>[];
  const setAt = (i: number, k: string, v: string) => onChange(recs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className={c.list}>
      {recs.map((r, i) => (
        <div key={i} className={c.record}>
          <div className={c.recordHead}>
            <span className={c.num}>{String(i + 1).padStart(2, "0")}</span>
            <div className={c.itemTools}>
              <button type="button" title="Вище" disabled={i === 0} onClick={() => { const n = [...recs]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; onChange(n); }}>
                <Icon d={UP} size={14} />
              </button>
              <button type="button" title="Прибрати" disabled={recs.length === 1} onClick={() => onChange(recs.filter((_, j) => j !== i))}>
                <Icon d={X} size={14} />
              </button>
            </div>
          </div>
          {f.parts!.map((p) =>
            p.long ? (
              <label key={p.key} className={c.part}>
                <span>{p.label}</span>
                <AutoText value={r[p.key] ?? ""} onChange={(v) => setAt(i, p.key, v)} />
              </label>
            ) : (
              <label key={p.key} className={c.part}>
                <span>{p.label}</span>
                <input className={c.input} value={r[p.key] ?? ""} onChange={(e) => setAt(i, p.key, e.target.value)} />
              </label>
            ),
          )}
        </div>
      ))}
      <button type="button" className={c.add} onClick={() => onChange([...recs, Object.fromEntries(f.parts!.map((p) => [p.key, ""]))])}>
        <Icon d={PLUS} size={14} /> Додати
      </button>
    </div>
  );
}

/** blank strings and empty items would render as holes on the site */
function tidy(f: TextField, v: Value): Value | null {
  if (typeof v === "string") return v.trim() ? v : null;
  if (f.kind === "list") {
    const l = (v as string[]).map((x) => x.trim()).filter(Boolean);
    return l.length ? l : null;
  }
  const r = (v as Record<string, string>[]).filter((x) => Object.values(x).some((y) => y.trim()));
  return r.length ? r : null;
}

export default function ContentPage() {
  const { token, fail } = useAdmin();
  const [saved, setSaved] = useState<Record<string, SavedText> | null>(null);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const load = useCallback(
    () =>
      getAdminContent(token)
        .then((rows) => setSaved(Object.fromEntries(rows.map((r) => [r.key, r]))))
        .catch((e) => setError(fail(e))),
    [token, fail],
  );
  useEffect(() => {
    load();
  }, [load]);

  /** what the field shows: the pending change, else the saved text, else the built-in one */
  const current = (f: TextField): Value => {
    if (f.key in drafts) return (drafts[f.key] ?? f.default) as Value;
    return ((saved?.[f.key]?.value as Value) ?? f.default) as Value;
  };

  /** what a value amounts to on the site: null means the built-in text */
  const settle = (f: TextField, v: Value | null | undefined): Value | null => {
    if (v == null) return null;
    const t = tidy(f, v);
    return t === null || same(t, f.default) ? null : t;
  };

  // a field is dirty when what it would save differs from what is saved
  const dirty = useMemo(
    () =>
      Object.keys(drafts).filter((k) => {
        const f = TEXT_FIELDS.find((x) => x.key === k)!;
        return !same(settle(f, drafts[k]), settle(f, saved?.[k]?.value as Value | undefined));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drafts, saved],
  );

  // drafts stay exactly as typed; clearing a field must not snap it back mid-edit
  const change = (f: TextField, v: Value | null) => setDrafts((d) => ({ ...d, [f.key]: v }));

  const save = useCallback(async () => {
    if (!dirty.length || busy) return;
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(
        dirty.map((k) => [k, settle(TEXT_FIELDS.find((x) => x.key === k)!, drafts[k])]),
      );
      await saveContent(token, values);
      setDrafts({});
      await load();
      setFlash(`Збережено ${dirty.length} ${dirty.length === 1 ? "поле" : "полів"} – уже на сайті`);
      setTimeout(() => setFlash(""), 3500);
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  }, [dirty, busy, drafts, token, fail, load]);

  // ⌘S / Ctrl+S saves; leaving with unsaved edits asks first
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty.length) e.preventDefault();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("beforeunload", leave);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("beforeunload", leave);
    };
  }, [save, dirty.length]);

  async function previous(f: TextField) {
    try {
      const h = await contentHistory(token, f.key);
      if (!h.length) return setFlash("Попередніх версій немає");
      change(f, h[0].value as Value);
      setFlash(`Підставлено версію від ${when(h[0].changed_at)} – збережіть, щоб застосувати`);
      setTimeout(() => setFlash(""), 4000);
    } catch (e) {
      setError(fail(e));
    }
  }

  const needle = q.trim().toLowerCase();
  const fields = TEXT_FIELDS.filter(
    (f) => !needle || `${f.label} ${f.section} ${JSON.stringify(current(f))}`.toLowerCase().includes(needle),
  );
  const sections = [...new Set(fields.map((f) => f.section))];
  const changedCount = saved ? Object.keys(saved).filter((k) => TEXT_FIELDS.some((f) => f.key === k)).length : 0;

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Контент</h1>
          <p className={s.sub}>
            Тексти сайту. Після збереження зміни видно відвідувачам одразу, без перезбирання.
            {changedCount > 0 && ` Змінено полів: ${changedCount}.`}
          </p>
        </div>
        <div className={s.headActions}>
          {dirty.length > 0 && (
            <button type="button" className={s.btn} onClick={() => setDrafts({})} disabled={busy}>
              Скасувати
            </button>
          )}
          <button type="button" className={s.btnPrimary} onClick={save} disabled={!dirty.length || busy}>
            {busy ? "Зберігаємо…" : dirty.length ? `Зберегти (${dirty.length})` : "Збережено"}
          </button>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}
      {flash && <p className={c.flash}>{flash}</p>}

      <div className={s.toolbar}>
        <label className={s.search}>
          <Icon d={SEARCH} size={16} />
          <input type="search" placeholder="Знайти текст або поле" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <nav className={c.jump}>
          {sections.map((sec) => (
            <a key={sec} href={`#${encodeURIComponent(sec)}`}>
              {sec}
            </a>
          ))}
        </nav>
      </div>

      {saved === null ? (
        <div className={s.empty}>Завантаження…</div>
      ) : (
        sections.map((sec) => (
          <section key={sec} id={encodeURIComponent(sec)} className={`${s.panel} ${c.section}`}>
            <div className={s.panelHead}>
              <h2 className={s.h2}>{sec}</h2>
            </div>
            <div className={c.fields}>
              {fields
                .filter((f) => f.section === sec)
                .map((f) => {
                  const pending = dirty.includes(f.key);
                  const custom = f.key in drafts ? settle(f, drafts[f.key]) !== null : !!saved[f.key];
                  const v = current(f);
                  return (
                    <div key={f.key} className={`${c.field} ${pending ? c.fieldDirty : ""}`}>
                      <div className={c.fieldHead}>
                        <span className={c.label}>{f.label}</span>
                        {pending ? (
                          <span className={c.tagDirty}>не збережено</span>
                        ) : custom ? (
                          <span className={c.tagCustom} title={saved[f.key] ? `${when(saved[f.key].updated_at)}${saved[f.key].updated_by ? ` · ${saved[f.key].updated_by}` : ""}` : ""}>
                            змінено
                          </span>
                        ) : (
                          <span className={c.tagDefault}>стандартний</span>
                        )}
                        {typeof v === "string" && <span className={c.count}>{v.length}</span>}
                      </div>
                      {f.hint && <p className={c.hint}>{f.hint}</p>}
                      <Editor f={f} value={v} onChange={(x) => change(f, x)} />
                      <div className={c.tools}>
                        {custom && (
                          <button type="button" onClick={() => change(f, null)}>
                            Повернути стандартний
                          </button>
                        )}
                        {(saved[f.key]?.versions ?? 0) > 0 && (
                          <button type="button" onClick={() => previous(f)}>
                            <Icon d={UNDO} size={13} /> Попередня версія
                          </button>
                        )}
                        <a href={f.page} target="_blank" rel="noopener noreferrer">
                          <Icon d={EXT} size={13} /> На сайті
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))
      )}

      {dirty.length > 0 && (
        <div className={c.saveBar}>
          <span>
            Незбережених змін: <b>{dirty.length}</b> · ⌘S / Ctrl+S
          </span>
          <button type="button" className={s.btnPrimary} onClick={save} disabled={busy}>
            {busy ? "Зберігаємо…" : "Зберегти"}
          </button>
        </div>
      )}
    </>
  );
}
