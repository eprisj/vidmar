"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BookCover from "@/components/BookCover";
import { Icon, useAdmin } from "@/components/admin/AdminShell";
import Drawer from "@/components/admin/Drawer";
import s from "@/components/admin/admin.module.css";
import { uah } from "@/components/admin/labels";
import {
  createBook,
  deleteBook,
  listAdminBooks,
  updateBook,
  uploadEbook,
  type AdminBook,
  type BookInput,
} from "@/lib/api";
import { genres } from "@/lib/content";

const SEARCH = "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4";
const PLUS = "M12 5v14M5 12h14";

const EMPTY: BookInput = {
  slug: "",
  title: "",
  author: "",
  genre_slug: "",
  description: "",
  cover_url: "",
  status: "coming_soon",
  sort_order: 0,
  print_price_cents: null,
  ebook_price_cents: null,
  print_old_price_cents: null,
  ebook_old_price_cents: null,
  stock: null,
  sku: "",
  pages: null,
  year: null,
  binding: "",
  isbn: "",
  excerpt: "",
  cover_pos: "",
  series: "",
  language: "Українська",
  translator: "",
  illustrator: "",
  dimensions: "",
  weight_g: null,
  age_rating: "",
  is_demo: false,
};

const toUah = (c: number | null | undefined) => (c == null ? "" : String(c / 100));
const toCents = (v: string) => (v.trim() === "" ? null : Math.round(Number(v.replace(",", ".")) * 100));
const toInt = (v: string) => (v.trim() === "" ? null : Math.round(Number(v)));

// slug from a Ukrainian title, the way the passport transliteration does it
const TR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i",
  й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh",
  ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", "ʼ": "", "'": "", "’": "",
};
const slugify = (t: string) =>
  t
    .toLowerCase()
    .split("")
    .map((ch) => TR[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

function fromBook(b: AdminBook): BookInput {
  const out: BookInput = { ...EMPTY };
  for (const k of Object.keys(EMPTY) as (keyof BookInput)[]) {
    const v = (b as unknown as Record<string, unknown>)[k];
    (out as unknown as Record<string, unknown>)[k] = v ?? (typeof EMPTY[k] === "string" ? "" : EMPTY[k]);
  }
  return out;
}

function Field({
  label,
  children,
  span,
}: {
  label: string;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <label className={`${s.field} ${span ? s.span2 : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function BookDrawer({
  book,
  onClose,
  onSaved,
}: {
  book: AdminBook | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token, fail } = useAdmin();
  const [f, setF] = useState<BookInput>(book ? fromBook(book) : EMPTY);
  const [slugTouched, setSlugTouched] = useState(!!book);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [upload, setUpload] = useState<Record<string, string>>({});
  const set = <K extends keyof BookInput>(k: K, v: BookInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const text = (k: keyof BookInput) => ({
    value: String(f[k] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value as never),
  });

  async function save() {
    setBusy(true);
    setError("");
    try {
      if (book) await updateBook(token, book.id, f);
      else await createBook(token, f);
      onSaved();
      onClose();
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!book || !confirm(`Видалити «${book.title}» назавжди? Замовлення з нею лишаться, книга зникне з каталогу.`)) return;
    try {
      await deleteBook(token, book.id);
      onSaved();
      onClose();
    } catch (e) {
      setError(fail(e));
    }
  }

  return (
    <Drawer
      title={book ? book.title : "Нова книга"}
      sub={book ? `${book.sku ?? ""} · ${book.slug}` : "Заповніть і збережіть: книга зʼявиться на сайті одразу, якщо статус «у каталозі»"}
      onClose={onClose}
      foot={
        <>
          {book && (
            <button type="button" className={s.btnDanger} onClick={remove} style={{ marginRight: "auto" }}>
              Видалити
            </button>
          )}
          <button type="button" className={s.btnGhost} onClick={onClose}>
            Скасувати
          </button>
          <button type="button" className={s.btnPrimary} disabled={busy || !f.title || !f.slug} onClick={save}>
            {busy ? "Зберігаємо…" : "Зберегти"}
          </button>
        </>
      }
    >
      {error && <p className={s.error}>{error}</p>}

      <div className={s.fieldset}>
        <span className={s.legend}>Основне</span>
        <div className={s.formGrid}>
          <Field label="Назва" span>
            <input
              value={f.title}
              onChange={(e) => {
                const title = e.target.value;
                setF((x) => ({ ...x, title, ...(slugTouched ? {} : { slug: slugify(title) }) }));
              }}
            />
          </Field>
          <Field label="Автор">
            <input {...text("author")} />
          </Field>
          <Field label="Адреса сторінки (slug)">
            <input
              value={f.slug}
              disabled={!!book}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
            />
          </Field>
          <Field label="Напрям">
            <select value={f.genre_slug ?? ""} onChange={(e) => set("genre_slug", e.target.value)}>
              <option value="">без напряму</option>
              {genres.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Статус">
            <select value={f.status} onChange={(e) => set("status", e.target.value)}>
              <option value="published">У каталозі</option>
              <option value="coming_soon">Прихована</option>
            </select>
          </Field>
          <Field label="Порядок у каталозі">
            <input type="number" value={f.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} />
          </Field>
          <label className={s.check}>
            <input type="checkbox" checked={!!f.is_demo} onChange={(e) => set("is_demo", e.target.checked)} />
            Тестова книга (не рахується у виручці)
          </label>
        </div>
      </div>

      <div className={s.fieldset}>
        <span className={s.legend}>Ціни й склад</span>
        <div className={s.formGrid}>
          <Field label="Паперова, грн">
            <input inputMode="decimal" value={toUah(f.print_price_cents)} onChange={(e) => set("print_price_cents", toCents(e.target.value))} placeholder="не продається" />
          </Field>
          <Field label="Стара ціна паперової">
            <input inputMode="decimal" value={toUah(f.print_old_price_cents)} onChange={(e) => set("print_old_price_cents", toCents(e.target.value))} placeholder="без знижки" />
          </Field>
          <Field label="Електронна, грн">
            <input inputMode="decimal" value={toUah(f.ebook_price_cents)} onChange={(e) => set("ebook_price_cents", toCents(e.target.value))} placeholder="не продається" />
          </Field>
          <Field label="Стара ціна електронної">
            <input inputMode="decimal" value={toUah(f.ebook_old_price_cents)} onChange={(e) => set("ebook_old_price_cents", toCents(e.target.value))} placeholder="без знижки" />
          </Field>
          <Field label="Залишок, шт.">
            <input inputMode="numeric" value={f.stock ?? ""} onChange={(e) => set("stock", toInt(e.target.value))} placeholder="без обліку" />
          </Field>
          <Field label="Артикул (SKU)">
            <input value={f.sku ?? ""} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="автоматично VDM-0000" />
          </Field>
        </div>
      </div>

      <div className={s.fieldset}>
        <span className={s.legend}>Обкладинка</span>
        <div className={s.row} style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
          <span style={{ width: 96, flex: "none" }}>
            <BookCover title={f.title || "Назва"} author={f.author} src={f.cover_url || null} pos={f.cover_pos || null} />
          </span>
          <div className={s.formGrid} style={{ flex: 1, gridTemplateColumns: "1fr" }}>
            <Field label="Адреса зображення">
              <input {...text("cover_url")} placeholder="/gravure/… або https://…" />
            </Field>
            <Field label="Кадрування">
              <input {...text("cover_pos")} placeholder="50% 40%" />
            </Field>
          </div>
        </div>
      </div>

      <div className={s.fieldset}>
        <span className={s.legend}>Видання</span>
        <div className={s.formGrid3}>
          <Field label="Серія">
            <input {...text("series")} />
          </Field>
          <Field label="Мова">
            <input {...text("language")} />
          </Field>
          <Field label="Вік">
            <input {...text("age_rating")} placeholder="16+" />
          </Field>
          <Field label="Перекладач">
            <input {...text("translator")} />
          </Field>
          <Field label="Ілюстратор">
            <input {...text("illustrator")} />
          </Field>
          <Field label="Палітурка">
            <input {...text("binding")} placeholder="Тверда палітурка" />
          </Field>
          <Field label="Сторінок">
            <input inputMode="numeric" value={f.pages ?? ""} onChange={(e) => set("pages", toInt(e.target.value))} />
          </Field>
          <Field label="Рік">
            <input inputMode="numeric" value={f.year ?? ""} onChange={(e) => set("year", toInt(e.target.value))} />
          </Field>
          <Field label="ISBN">
            <input {...text("isbn")} />
          </Field>
          <Field label="Формат">
            <input {...text("dimensions")} placeholder="145×215 мм" />
          </Field>
          <Field label="Вага, г">
            <input inputMode="numeric" value={f.weight_g ?? ""} onChange={(e) => set("weight_g", toInt(e.target.value))} />
          </Field>
        </div>
      </div>

      <div className={s.fieldset}>
        <span className={s.legend}>Текст</span>
        <Field label="Опис">
          <textarea rows={4} {...text("description")} />
        </Field>
        <Field label="Уривок">
          <textarea rows={2} {...text("excerpt")} />
        </Field>
      </div>

      {book && (
        <div className={s.fieldset}>
          <span className={s.legend}>Файли електронної книги</span>
          <div className={s.row}>
            {(["pdf", "epub"] as const).map((kind) => {
              const key = `${book.id}-${kind}`;
              const has = !!book[`ebook_${kind}`];
              return (
                <label key={kind} className={s.btn} style={{ cursor: "pointer" }}>
                  {kind.toUpperCase()}: {upload[key] ?? (has ? "завантажено, замінити" : "завантажити")}
                  <input
                    type="file"
                    hidden
                    accept={kind === "pdf" ? "application/pdf" : ".epub,application/epub+zip"}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        await uploadEbook(token, book.id, kind, file, (p) =>
                          setUpload((u) => ({ ...u, [key]: `${Math.round(p * 100)}%` })),
                        );
                        setUpload((u) => ({ ...u, [key]: "готово" }));
                        onSaved();
                      } catch {
                        setUpload((u) => ({ ...u, [key]: "помилка" }));
                      }
                    }}
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function StockCell({ b, onSaved }: { b: AdminBook; onSaved: () => void }) {
  const { token, fail } = useAdmin();
  const [v, setV] = useState(b.stock == null ? "" : String(b.stock));
  const [state, setState] = useState<"" | "saving" | "ok" | "err">("");
  useEffect(() => setV(b.stock == null ? "" : String(b.stock)), [b.stock]);

  async function commit() {
    const next = v.trim() === "" ? null : Math.max(0, Math.round(Number(v)));
    if (next === (b.stock ?? null) || Number.isNaN(next)) return;
    setState("saving");
    try {
      await updateBook(token, b.id, { stock: next });
      setState("ok");
      onSaved();
      setTimeout(() => setState(""), 1200);
    } catch (e) {
      fail(e);
      setState("err");
    }
  }

  return (
    <input
      className={s.inline}
      value={v}
      inputMode="numeric"
      placeholder="∞"
      aria-label={`Залишок: ${b.title}`}
      title={b.print_price_cents == null ? "Паперова не продається" : "Enter щоб зберегти, порожньо = без обліку"}
      style={{
        borderColor: state === "ok" ? "var(--a-ok)" : state === "err" ? "var(--a-bad)" : undefined,
        color: b.stock === 0 ? "var(--a-bad)" : b.stock != null && b.stock <= 5 ? "var(--a-warn)" : undefined,
      }}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setV(e.target.value.replace(/[^\d]/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

export default function BooksPage() {
  const { token, fail } = useAdmin();
  const [books, setBooks] = useState<AdminBook[] | null>(null);
  const [tab, setTab] = useState<"all" | "live" | "hidden" | "low">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<AdminBook | "new" | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      listAdminBooks(token)
        .then((x) => {
          setBooks(x);
          setError("");
        })
        .catch((e) => setError(fail(e))),
    [token, fail],
  );

  useEffect(() => {
    load();
  }, [load]);

  const all = books ?? [];
  const tabs = {
    all: all,
    live: all.filter((b) => b.status === "published"),
    hidden: all.filter((b) => b.status !== "published"),
    low: all.filter((b) => b.stock != null && b.stock <= 5),
  };
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return tabs[tab].filter(
      (b) => !n || [b.title, b.author, b.sku, b.isbn, b.slug, b.series].join(" ").toLowerCase().includes(n),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, tab, q]);

  async function toggleLive(b: AdminBook) {
    try {
      await updateBook(token, b.id, { status: b.status === "published" ? "coming_soon" : "published" });
      load();
    } catch (e) {
      setError(fail(e));
    }
  }

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Книги</h1>
          <p className={s.sub}>
            {tabs.live.length} у каталозі · {tabs.hidden.length} прихованих · {tabs.low.length} закінчуються
          </p>
        </div>
        <div className={s.headActions}>
          <button type="button" className={s.btnPrimary} onClick={() => setOpen("new")}>
            <Icon d={PLUS} size={16} /> Нова книга
          </button>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.toolbar}>
        <div className={s.tabs} role="tablist">
          {(
            [
              ["all", "Усі"],
              ["live", "У каталозі"],
              ["hidden", "Приховані"],
              ["low", "Закінчуються"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={`${s.tab} ${tab === k ? s.tabOn : ""}`}
              onClick={() => setTab(k)}
            >
              {label}
              <i>{tabs[k].length}</i>
            </button>
          ))}
        </div>
        <label className={s.search}>
          <Icon d={SEARCH} size={16} />
          <input type="search" placeholder="Назва, автор, артикул, ISBN" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className={s.tableWrap}>
        {books === null ? (
          <div className={s.empty}>Завантаження…</div>
        ) : shown.length === 0 ? (
          <div className={s.empty}>Нічого не знайшлось.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Книга</th>
                <th>Артикул</th>
                <th className={s.right}>Паперова</th>
                <th className={s.right}>E-book</th>
                <th className={s.right}>Залишок</th>
                <th className={s.hideSm}>Файли</th>
                <th>На сайті</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id} className={s.rowLink} onClick={() => setOpen(b)}>
                  <td>
                    <span className={s.cellBook}>
                      <span className={s.thumb}>
                        <BookCover title={b.title} src={b.cover_url} pos={b.cover_pos ?? null} size="small" />
                      </span>
                      <span>
                        <span className={s.strong}>{b.title}</span> {b.is_demo && <span className={s.tagDemo}>тест</span>}
                        <br />
                        <span className={s.dim}>
                          {b.author || "–"}
                          {b.genre_slug && ` · ${genres.find((g) => g.slug === b.genre_slug)?.title ?? b.genre_slug}`}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td>{b.sku && <span className={s.sku}>{b.sku}</span>}</td>
                  <td className={`${s.num} ${s.right}`}>
                    {uah(b.print_price_cents)}
                    {b.print_old_price_cents != null && b.print_price_cents != null && b.print_old_price_cents > b.print_price_cents && (
                      <>
                        <br />
                        <s className={s.dim}>{uah(b.print_old_price_cents)}</s>
                      </>
                    )}
                  </td>
                  <td className={`${s.num} ${s.right}`}>
                    {uah(b.ebook_price_cents)}
                    {b.ebook_old_price_cents != null && b.ebook_price_cents != null && b.ebook_old_price_cents > b.ebook_price_cents && (
                      <>
                        <br />
                        <s className={s.dim}>{uah(b.ebook_old_price_cents)}</s>
                      </>
                    )}
                  </td>
                  <td className={s.right}>
                    <StockCell b={b} onSaved={load} />
                  </td>
                  <td className={s.hideSm}>
                    <span className={s.dim}>
                      {b.ebook_price_cents == null ? "–" : [b.ebook_pdf && "PDF", b.ebook_epub && "EPUB"].filter(Boolean).join(" · ") || "немає"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${s.pill} ${b.status === "published" ? s.s_paid : s.s_fulfilled}`}
                      style={{ cursor: "pointer", background: "transparent" }}
                      title="Натисніть, щоб перемкнути"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLive(b);
                      }}
                    >
                      {b.status === "published" ? "У каталозі" : "Прихована"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <BookDrawer
          key={open === "new" ? "new" : open.id}
          book={open === "new" ? null : open}
          onClose={() => setOpen(null)}
          onSaved={load}
        />
      )}
    </>
  );
}
