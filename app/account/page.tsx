"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import AuthGate from "@/components/AuthGate";
import { formatPrice, listMyOrders, type OrderSummary } from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "очікує оплати",
  paid: "оплачено",
  cancelled: "скасовано",
  fulfilled: "виконано",
};

function Orders() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    listMyOrders().then(setOrders);
  }, []);

  if (orders === null) return null;
  if (orders.length === 0) {
    return <p className="body" style={{ opacity: 0.7 }}>Замовлень поки немає.</p>;
  }

  return (
    <ul style={{ display: "grid", gap: 10, padding: 0, listStyle: "none" }}>
      {orders.map((o) => (
        <li
          key={o.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            border: "1px solid var(--hair-d)",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          <span>Замовлення #{o.id}</span>
          <span>{formatPrice(o.total_cents, o.currency)}</span>
          <span style={{ opacity: 0.7 }}>{STATUS_LABEL[o.status] || o.status}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AccountPage() {
  return (
    <>
      <PageHero label="Кабінет" title="Ваш кабінет" variant={2} />
      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          <Reveal>
            <span className="micro micro--bright">увійти або зареєструватись</span>
          </Reveal>
          <div style={{ marginTop: "clamp(24px,3vw,40px)" }}>
            <AuthGate>
              {(user, signOut) => (
                <div style={{ display: "grid", gap: 32 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p className="body">
                      Ви увійшли як <strong>{user.name || user.email}</strong>.
                    </p>
                    <button type="button" className="pill" onClick={signOut}>
                      Вийти
                    </button>
                  </div>

                  <div>
                    <span className="micro">ваші замовлення</span>
                    <div style={{ marginTop: 16 }}>
                      <Orders />
                    </div>
                  </div>

                  <p className="body">
                    <Link href="/cart">Перейти до кошика →</Link>
                  </p>
                </div>
              )}
            </AuthGate>
          </div>
        </div>
      </section>
    </>
  );
}
