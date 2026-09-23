"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { checkReader } from "@/lib/api";
import styles from "./r.module.css";

function Check() {
  const code = (useSearchParams().get("c") || "").toUpperCase();
  const [res, setRes] = useState<{ valid: boolean; since?: string } | null | undefined>(undefined);

  useEffect(() => {
    if (!code) return setRes(null);
    checkReader(code).then(setRes);
  }, [code]);

  if (res === undefined) return <div className={styles.box} aria-busy="true" />;

  const ok = !!res?.valid;
  return (
    <div className={`${styles.box} ${ok ? styles.ok : styles.bad}`}>
      <svg className={styles.mark} viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="30" />
        {ok ? <path d="M20 33l8 8 16-18" /> : <path d="M23 23l18 18M41 23L23 41" />}
      </svg>
      <span className={styles.code}>{code || "код не вказано"}</span>
      <h1 className={styles.h1}>{ok ? "Дійсна картка читача" : "Такої картки немає"}</h1>
      <p className={styles.p}>
        {ok && res?.since
          ? `Читач видавництва ВІДЬМАР з ${new Date(res.since).toLocaleDateString("uk-UA", { month: "long", year: "numeric" })}.`
          : "Перевірте код: він має вигляд VR-XXXX-XXXX."}
      </p>
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
