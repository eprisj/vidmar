"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, useAdmin } from "./AdminShell";
import s from "./admin.module.css";
import c from "./content.module.css";
import {
  adminFileUrl,
  deleteBookFile,
  fileSize,
  getStorage,
  listBookFiles,
  updateBookFile,
  uploadBookFile,
  type BookFile,
  type FileAccess,
} from "@/lib/api";

const ACCESS: { id: FileAccess; label: string; hint: string }[] = [
  { id: "buyers", label: "Покупцям", hint: "зʼявляться в замовленні покупця після оплати електронної книги" },
  { id: "public", label: "Усім", hint: "зʼявляться на сторінці книги в розділі «Матеріали»" },
  { id: "private", label: "Лише команді", hint: "буде видно тільки в адмінці" },
];

const DOWN = "M12 4v11M7 10l5 5 5-5M5 20h14";
const TRASH = "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13";
const UP = "M12 19V5M6 11l6-6 6 6";
const UPLOAD = "M12 20V9M7 14l5-5 5 5M5 4h14";

type Pending = { key: string; name: string; share: number; error?: string };

export default function BookFiles({ bookId }: { bookId: number }) {
  const { token, fail } = useAdmin();
  const [files, setFiles] = useState<BookFile[] | null>(null);
  const [access, setAccess] = useState<FileAccess>("buyers");
  const [pending, setPending] = useState<Pending[]>([]);
  const [over, setOver] = useState(false);
  const [room, setRoom] = useState<{ free: number; max_file: number } | null>(null);
  const [error, setError] = useState("");
  const pick = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    listBookFiles(token, bookId).then(setFiles).catch((e) => setError(fail(e)));
    getStorage(token).then(setRoom).catch(() => {});
  }, [token, bookId, fail]);
  useEffect(load, [load]);

  async function upload(list: FileList | File[]) {
    setError("");
    for (const file of Array.from(list)) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      if (room && file.size > room.max_file) {
        setPending((p) => [...p, { key, name: file.name, share: 0, error: `більше ${fileSize(room.max_file)}` }]);
        continue;
      }
      setPending((p) => [...p, { key, name: file.name, share: 0 }]);
      try {
        await uploadBookFile(bookId, file, { access, label: file.name.replace(/\.[^.]+$/, "") }, (share) =>
          setPending((p) => p.map((x) => (x.key === key ? { ...x, share } : x))),
        );
        setPending((p) => p.filter((x) => x.key !== key));
        load();
      } catch (e) {
        const msg = fail(e);
        setPending((p) => p.map((x) => (x.key === key ? { ...x, error: msg } : x)));
      }
    }
  }

  async function patch(f: BookFile, change: Partial<Pick<BookFile, "label" | "access" | "sort_order">>) {
    try {
      const next = await updateBookFile(token, f.id, change);
      setFiles((all) => all?.map((x) => (x.id === f.id ? next : x)) ?? null);
    } catch (e) {
      setError(fail(e));
    }
  }

  async function lift(i: number) {
    if (!files || i === 0) return;
    const order = [...files];
    [order[i - 1], order[i]] = [order[i], order[i - 1]];
    setFiles(order);
    try {
      await Promise.all(order.map((f, n) => (f.sort_order !== n ? updateBookFile(token, f.id, { sort_order: n }) : null)));
    } catch (e) {
      setError(fail(e));
    }
    load();
  }

  async function remove(f: BookFile) {
    if (!confirm(`Видалити «${f.label || f.name}»? Файл зникне з сервера.`)) return;
    try {
      await deleteBookFile(token, f.id);
      setFiles((all) => all?.filter((x) => x.id !== f.id) ?? null);
    } catch (e) {
      setError(fail(e));
    }
  }

  const ext = (n: string) => (n.split(".").pop() || "file").slice(0, 5);

  return (
    <div className={s.fieldset}>
      <span className={s.legend}>Файли книги</span>

      <div className={c.accessPick} role="group" aria-label="Кому доступні нові файли">
        {ACCESS.map((a) => (
          <button key={a.id} type="button" title={a.hint} className={access === a.id ? c.accessOn : ""} onClick={() => setAccess(a.id)}>
            {a.label}
          </button>
        ))}
      </div>

      <div
        className={`${c.drop} ${over ? c.dropOn : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => pick.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pick.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
      >
        <Icon d={UPLOAD} size={22} />
        <span>
          <b>Перетягніть файли сюди</b> або натисніть, щоб вибрати
        </span>
        <span>
          Будь-які формати: PDF, EPUB, MOBI, FB2, аудіо, архіви, макети. Нові файли {ACCESS.find((a) => a.id === access)!.hint}.
          {room && ` До ${fileSize(room.max_file)} на файл · вільно ${fileSize(room.free)}.`}
        </span>
        <input
          ref={pick}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className={s.error}>{error}</p>}

      <div className={c.files}>
        {pending.map((p) => (
          <div key={p.key} className={c.file}>
            <span className={c.ext}>{ext(p.name)}</span>
            <div className={c.fileMain}>
              <span className={c.fileName}>{p.name}</span>
              {p.error ? (
                <span className={s.error} style={{ margin: 0 }}>Не завантажено: {p.error}</span>
              ) : (
                <div className={c.progress}>
                  <span style={{ width: `${Math.round(p.share * 100)}%` }} />
                </div>
              )}
            </div>
            <div className={c.fileSide}>
              {p.error ? (
                <button type="button" className={s.btnGhost} onClick={() => setPending((x) => x.filter((y) => y.key !== p.key))}>
                  Сховати
                </button>
              ) : (
                <span className={s.dim}>{Math.round(p.share * 100)}%</span>
              )}
            </div>
          </div>
        ))}

        {files?.map((f, i) => (
          <div key={f.id} className={c.file}>
            <span className={c.ext}>{ext(f.name)}</span>
            <div className={c.fileMain}>
              <input
                className={c.fileLabel}
                defaultValue={f.label ?? ""}
                placeholder={f.name}
                aria-label="Назва для покупця"
                onBlur={(e) => e.target.value !== (f.label ?? "") && patch(f, { label: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              />
              <span className={c.fileName}>
                {f.name} · {fileSize(f.size)}
              </span>
            </div>
            <div className={c.fileSide}>
              <select value={f.access} onChange={(e) => patch(f, { access: e.target.value as FileAccess })} aria-label="Кому доступний">
                {ACCESS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              <button type="button" className={s.btnGhost} title="Вище" disabled={i === 0} onClick={() => lift(i)}>
                <Icon d={UP} size={15} />
              </button>
              <a className={s.btnGhost} href={adminFileUrl(f.id)} title="Завантажити">
                <Icon d={DOWN} size={15} />
              </a>
              <button type="button" className={s.btnGhost} title="Видалити" onClick={() => remove(f)}>
                <Icon d={TRASH} size={15} />
              </button>
            </div>
          </div>
        ))}
        {files && !files.length && !pending.length && <p className={s.dim}>Додаткових файлів ще немає.</p>}
      </div>
    </div>
  );
}
