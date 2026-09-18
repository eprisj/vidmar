"use client";

import { useState } from "react";
import { useToast } from "./ToastProvider";
import styles from "./Subscribe.module.css";

export default function Subscribe() {
  const toast = useToast();
  const [email, setEmail] = useState("");

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (!email) return;
        setEmail("");
        toast("готово — лист про підтвердження вже летить");
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
      <button type="submit" className="pill">
        Підписатись
      </button>
    </form>
  );
}
