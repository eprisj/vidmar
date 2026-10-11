"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { unsubscribeByToken } from "@/lib/api";
import styles from "../r/r.module.css";

type State = "working" | "done" | "gone" | "error";

function Unsubscribe() {
  const token = useSearchParams().get("t") || "";
  const [state, setState] = useState<State>(token ? "working" : "gone");

  useEffect(() => {
    if (!token) return;
    unsubscribeByToken(token)
      .then((removed) => setState(removed ? "done" : "gone"))
      .catch(() => setState("error"));
  }, [token]);

  const text: Record<State, [string, string]> = {
    working: ["Відписуємо…", "Одну мить."],
    done: ["Ви відписалися", "Більше листів із новинами від нас не буде. Замовлення й кабінет це не зачіпає."],
    gone: ["Цієї адреси вже немає у списку", "Або посилання застаріло. Якщо листи все ще приходять, напишіть нам."],
    error: ["Не вдалося відписати", "Спробуйте ще раз за хвилину або напишіть нам, ми приберемо адресу вручну."],
  };
  const [title, note] = text[state];

  return (
    <section className={`deep ${styles.root}`}>
      <div className={`wrap ${styles.box}`} role="status" aria-live="polite">
        <h1 className={styles.h1}>{title}</h1>
        <p className={styles.p}>{note}</p>
        <Link href="/" className="pill">
          На головну
        </Link>
      </div>
    </section>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <Unsubscribe />
    </Suspense>
  );
}
