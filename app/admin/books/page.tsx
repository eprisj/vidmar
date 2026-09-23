"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  createBook,
  deleteBook,
  uploadEbook,
  formatPrice,
  listAdminBooks,
  updateBook,
  type AdminBook,
  type BookInput,
} from "@/lib/api";
import { genres } from "@/lib/content";

const TOKEN_KEY = "vidmar-admin-token";

const EMPTY: BookInput = {
  slug: "",
  title: "",
  author: "",
  genre_slug: "",
  description: "",
  cover_url: "",
  status: "coming_soon",
  sort_order: 0,
  price_cents: null,
  currency: "UAH",
  print_price_cents: null,
  ebook_price_cents: null,
  stock: null,
  pages: null,
  year: null,
  binding: "",
  isbn: "",
  excerpt: "",
  cover_pos: "",
  is_demo: false,
};

const uah = (c: number | null | undefined) => (c == null ? "" : c / 100);
const cents = (v: string) => (v === "" ? null : Math.round(Number(v) * 100));
const int = (v: string) => (v === "" ? null : Math.round(Number(v)));

export default function AdminBooksPage() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [form, setForm] = useState<BookInput>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [upload, setUpload] = useState<Record<string, string>>({});
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
      setBooks(await listAdminBooks(token));
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

  function startEdit(book: AdminBook) {
    setEditingId(book.id);
    setForm({
      slug: book.slug,
      title: book.title,
      author: book.author || "",
      genre_slug: book.genre_slug || "",
      description: book.description || "",
      cover_url: book.cover_url || "",
      status: book.status,
      sort_order: book.sort_order,
      price_cents: book.price_cents,
      currency: book.currency || "UAH",
      print_price_cents: book.print_price_cents ?? null,
      ebook_price_cents: book.ebook_price_cents ?? null,
      stock: (book as AdminBook & { stock?: number | null }).stock ?? null,
      pages: book.pages ?? null,
      year: book.year ?? null,
      binding: book.binding || "",
      isbn: book.isbn || "",
      excerpt: book.excerpt || "",
      cover_pos: book.cover_pos || "",
      is_demo: !!book.is_demo,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await updateBook(token, editingId, form);
      } else {
        await createBook(token, form);
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "не вдалося зберегти");
    }
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
    <main style={{ padding: 40, maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>Книги ({books.length})</h1>
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

      <form onSubmit={submit} style={{ display: "grid", gap: 10, margin: "24px 0", maxWidth: 520 }}>
        <h2 style={{ fontSize: 16 }}>{editingId ? `Редагувати #${editingId}` : "Нова книга"}</h2>
        <input
          placeholder="slug (унікальний, напр. persha-kniga)"
          value={form.slug}
          disabled={!!editingId}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          required
          style={{ padding: 8 }}
        />
        <input
          placeholder="назва"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          style={{ padding: 8 }}
        />
        <input
          placeholder="автор"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
          style={{ padding: 8 }}
        />
        <select
          value={form.genre_slug}
          onChange={(e) => setForm({ ...form, genre_slug: e.target.value })}
          style={{ padding: 8 }}
        >
          <option value="">без напряму</option>
          {genres.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.title}
            </option>
          ))}
        </select>
        <textarea
          placeholder="опис"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          style={{ padding: 8 }}
        />
        <input
          placeholder="URL обкладинки"
          value={form.cover_url}
          onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
          style={{ padding: 8 }}
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={{ padding: 8 }}
        >
          <option value="coming_soon">coming_soon (прихована)</option>
          <option value="published">published (видима в каталозі)</option>
        </select>
        <div style={{ display: "flex", gap: 8 }}>
          <label style={{ flex: 1 }}>
            паперова, грн
            <input
              type="number"
              placeholder="порожньо = не продається"
              value={uah(form.print_price_cents)}
              onChange={(e) => setForm({ ...form, print_price_cents: cents(e.target.value) })}
              style={{ padding: 8, width: "100%" }}
            />
          </label>
          <label style={{ flex: 1 }}>
            електронна, грн
            <input
              type="number"
              placeholder="порожньо = не продається"
              value={uah(form.ebook_price_cents)}
              onChange={(e) => setForm({ ...form, ebook_price_cents: cents(e.target.value) })}
              style={{ padding: 8, width: "100%" }}
            />
          </label>
          <label style={{ width: 110 }}>
            залишок
            <input
              type="number"
              placeholder="∞"
              value={form.stock ?? ""}
              onChange={(e) => setForm({ ...form, stock: int(e.target.value) })}
              style={{ padding: 8, width: "100%" }}
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            placeholder="сторінок"
            value={form.pages ?? ""}
            onChange={(e) => setForm({ ...form, pages: int(e.target.value) })}
            style={{ padding: 8, flex: 1 }}
          />
          <input
            type="number"
            placeholder="рік"
            value={form.year ?? ""}
            onChange={(e) => setForm({ ...form, year: int(e.target.value) })}
            style={{ padding: 8, flex: 1 }}
          />
          <input
            placeholder="ISBN"
            value={form.isbn ?? ""}
            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            style={{ padding: 8, flex: 2 }}
          />
        </div>
        <input
          placeholder="палітурка, напр. Тверда палітурка, тканина"
          value={form.binding ?? ""}
          onChange={(e) => setForm({ ...form, binding: e.target.value })}
          style={{ padding: 8 }}
        />
        <textarea
          placeholder="уривок (одне-два речення)"
          value={form.excerpt ?? ""}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          rows={2}
          style={{ padding: 8 }}
        />
        <input
          placeholder="кадрування обкладинки, напр. 50% 40%"
          value={form.cover_pos ?? ""}
          onChange={(e) => setForm({ ...form, cover_pos: e.target.value })}
          style={{ padding: 8 }}
        />
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={!!form.is_demo}
            onChange={(e) => setForm({ ...form, is_demo: e.target.checked })}
          />
          демонстраційна книга
        </label>
        <input
          type="number"
          placeholder="порядок сортування"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          style={{ padding: 8 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{ padding: "8px 16px" }}>
            {editingId ? "Зберегти" : "Додати"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ padding: "8px 16px" }}>
              Скасувати
            </button>
          )}
        </div>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {loading && <p>завантаження…</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th>slug</th>
            <th>назва</th>
            <th>напрям</th>
            <th>статус</th>
            <th>папір / e-book</th>
            <th>файли e-book</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{b.slug}</td>
              <td>{b.title}</td>
              <td>{b.genre_slug}</td>
              <td>{b.status}</td>
              <td>
                {b.print_price_cents == null ? "–" : formatPrice(b.print_price_cents, b.currency)} /{" "}
                {b.ebook_price_cents == null ? "–" : formatPrice(b.ebook_price_cents, b.currency)}
                {b.is_demo && <span style={{ color: "#a67c00" }}> · демо</span>}
              </td>
              <td style={{ fontSize: 12 }}>
                {(["pdf", "epub"] as const).map((kind) => (
                  <label key={kind} style={{ display: "block", cursor: "pointer" }}>
                    {kind.toUpperCase()}: {b[`ebook_${kind}`] ? "✓" : "немає"}{" "}
                    <u>{upload[`${b.id}-${kind}`] ?? "завантажити"}</u>
                    <input
                      type="file"
                      accept={kind === "pdf" ? "application/pdf" : ".epub,application/epub+zip"}
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const key = `${b.id}-${kind}`;
                        try {
                          await uploadEbook(token, b.id, kind, file, (p) =>
                            setUpload((u) => ({ ...u, [key]: `${Math.round(p * 100)}%` })),
                          );
                          setUpload((u) => ({ ...u, [key]: "готово" }));
                          refresh();
                        } catch {
                          setUpload((u) => ({ ...u, [key]: "помилка" }));
                        }
                      }}
                    />
                  </label>
                ))}
              </td>
              <td style={{ display: "flex", gap: 6 }}>
                <button onClick={() => startEdit(b)}>ред.</button>
                <button
                  onClick={async () => {
                    if (!confirm(`Видалити "${b.title}"?`)) return;
                    await deleteBook(token, b.id);
                    refresh();
                  }}
                >
                  вид.
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
