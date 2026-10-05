"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { checkReader } from "@/lib/api";
import { since } from "@/components/ReaderCard";
import styles from "./r.module.css";

// the same alphabet the backend draws codes from: no 0/O, no 1/I/L
const ABC = /[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g;
/** "vr 2ab4cd5e" or a pasted link → "VR-2AB4-CD5E" as it is typed */
function tidy(raw: string) {
  const m = raw.match(/[?&]c=([^&#]+)/);
  let s = "";
  try {
    s = decodeURIComponent(m ? m[1] : raw);
  } catch {
    s = raw;
  }
  s = s.toUpperCase().replace(/^\s*VR/, "").replace(ABC, "").slice(0, 8);
  s = s.length > 4 ? `${s.slice(0, 4)}-${s.slice(4)}` : s;
  return s ? `VR-${s}` : "";
}

function CodeForm({ initial, label }: { initial: string; label: string }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const full = /^VR-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(v);
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (full) router.replace(`/r?c=${encodeURIComponent(v)}`);
      }}
    >
      <label className={styles.label} htmlFor="reader-code">
        {label}
      </label>
      <div className={styles.row}>
        <input
          id="reader-code"
          className={styles.input}
          value={v}
          onChange={(e) => setV(tidy(e.target.value))}
          placeholder="VR-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <button className="pill pill--solid" type="submit" disabled={!full}>
          Перевірити
        </button>
      </div>
    </form>
  );
}

function Check() {
  const code = tidy(useSearchParams().get("c") || "");
  const [res, setRes] = useState<{ valid: boolean; since?: string } | null | undefined>(undefined);
  const [at, setAt] = useState("");

  useEffect(() => {
    if (!code) return setRes(null);
    setRes(undefined);
    checkReader(code).then((r) => {
      setRes(r);
      // the moment of this check: a screenshot of an old "valid" shows an old time
      setAt(new Date().toLocaleString("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }));
    });
  }, [code]);

  if (!code) {
    return (
      <div className={styles.box}>
        <h1 className={styles.h1}>Перевірка картки читача</h1>
        <p className={styles.p}>Відскануйте QR-код з картки або введіть її номер.</p>
        <CodeForm initial="" label="Номер картки" />
      </div>
    );
  }

  if (res === undefined) return <div className={styles.box} aria-busy="true" />;

  const ok = !!res?.valid;
  // checkReader gives null when the API could not be reached at all
  const down = res === null;
  return (
    <div className={`${styles.box} ${ok ? styles.ok : styles.bad}`}>
      <svg className={styles.mark} viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="30" />
        {ok ? <path d="M20 33l8 8 16-18" /> : down ? <path d="M32 18v18M32 45v1" /> : <path d="M23 23l18 18M41 23L23 41" />}
      </svg>
      <span className={styles.code}>{code}</span>
      <h1 className={styles.h1} role="status">
        {ok ? "Дійсна картка читача" : down ? "Не вдалося перевірити" : "Такої картки немає"}
      </h1>
      <p className={styles.p}>
        {ok
          ? `Читач видавництва ВІДЬМАР${res?.since ? ` з ${since(res.since)}` : ""}.`
          : down
            ? "Немає зв'язку із сервером. Спробуйте ще раз за хвилину."
            : "Перевірте номер: він має вигляд VR-XXXX-XXXX."}
      </p>
      {ok && at && <span className={styles.at}>Перевірено {at}</span>}
      {!ok && <CodeForm initial={code} label="Ввести номер ще раз" />}
      <Link className="pill" href="/catalog">
        До каталогу
      </Link>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <section className={`deep ${styles.root}`} data-field="dark">
      <div className="wrapMax">
        <Suspense fallback={<div className={styles.box} />}>
          <Check />
        </Suspense>
      </div>
    </section>
  );
}
