"use client";

import { useState } from "react";
import { subscribe } from "@/lib/api";
import { useToast } from "./ToastProvider";
import styles from "./Subscribe.module.css";

export default function Subscribe() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className={styles.form}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!email || busy) return;
        setBusy(true);
        try {
          await subscribe(email);
          setEmail("");
          toast("готово — ви в списку");
        } catch {
          toast("не вдалося підписати, спробуйте пізніше");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input
        id="subscribe-email"
        type="email"
        required
        value={email}
        placeholder="ваша пошта"
        aria-label="Ваша пошта"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" className="pill" disabled={busy}>
        Підписатись
      </button>
    </form>
  );
}
