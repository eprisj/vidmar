"use client";

import { useEffect, useState } from "react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import AuthGate from "@/components/AuthGate";
import { useToast } from "@/components/ToastProvider";
import { ApiError, checkout, formatPrice, getCart, removeFromCart, type CartItem } from "@/lib/api";

function CartContents() {
  const toast = useToast();
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [busy, setBusy] = useState(false);

  function refresh() {
    getCart().then(setItems);
  }

  useEffect(refresh, []);

  if (items === null) return null;

  const total = items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);

  if (items.length === 0) {
    return <p className="body" style={{ opacity: 0.7 }}>Кошик порожній.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 560 }}>
      <ul style={{ display: "grid", gap: 10, padding: 0, listStyle: "none" }}>
        {items.map((i) => (
          <li
            key={i.slug}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              border: "1px solid var(--hair-d)",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
            <span>
              {i.title} × {i.quantity}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {formatPrice(i.price_cents * i.quantity, i.currency)}
              <button
                type="button"
                style={{ background: "none", border: "none", color: "var(--on-dark-mute)", cursor: "pointer" }}
                onClick={async () => {
                  await removeFromCart(i.slug);
                  refresh();
                }}
              >
                прибрати
              </button>
            </span>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
        <span>Разом</span>
        <span>{formatPrice(total, items[0].currency)}</span>
      </div>

      <button
        type="button"
        className="pill pill--solid"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await checkout();
            toast("замовлення оформлено — реквізити для оплати надішлемо на пошту");
            refresh();
          } catch (err) {
            toast(err instanceof ApiError ? err.message : "не вдалося оформити замовлення");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "оформлюємо…" : "Оформити замовлення"}
      </button>
    </div>
  );
}

export default function CartPage() {
  return (
    <>
      <PageHero label="Кошик" title="Ваш кошик" variant={1} />
      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          <Reveal>
            <span className="micro micro--bright">кошик</span>
          </Reveal>
          <div style={{ marginTop: "clamp(24px,3vw,40px)" }}>
            <AuthGate>{() => <CartContents />}</AuthGate>
          </div>
        </div>
      </section>
    </>
  );
}
