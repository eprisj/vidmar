"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import AuthGate from "@/components/AuthGate";
import { formatPrice, listMyOrders, type OrderSummary } from "@/lib/api";
import styles from "@/components/Shop.module.css";

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
    return (
      <p className={`body ${styles.note}`}>
        Замовлень поки немає. Перша книга ще готується – щойно вона з’явиться в{" "}
        <Link href="/catalog">каталозі</Link>, замовлення будуть тут.
      </p>
    );
  }

  return (
    <div className={styles.stack}>
      <ul className={styles.list}>
        {orders.map((o) => (
          <li key={o.id} className={styles.row}>
            <span className={styles.rowName}>Замовлення №{o.id}</span>
            <span className={styles.rowMeta}>
              <span>{formatPrice(o.total_cents, o.currency)}</span>
              <span className={styles.state}>{STATUS_LABEL[o.status] || o.status}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className={`body ${styles.note}`}>
        Оплата переказом: реквізити ми надсилаємо на вашу пошту після оформлення,
        а статус тут змінюється, щойно платіж надійде.
      </p>
    </div>
  );
}

export default function AccountPage() {
  return (
    <>
      <PageHero
        label="Кабінет"
        title="Ваш кабінет"
        lede="Тут живуть ваші замовлення та їхній стан. Поки полиця порожня, акаунт знадобиться, щойно вийде перше видання."
        variant={2}
      />

      <section className="ink pad" data-field="dark" data-candle="">
        <div className="wrapMax">
          <AuthGate
            aside={
              <>
                <p>
                  Акаунт потрібен тільки для замовлень: він тримає ваш кошик і
                  показує, на якому етапі кожне замовлення.
                </p>
                <p>
                  Пошта – щоб надіслати реквізити для оплати й підтвердження.
                  Більше ні для чого: розсилка окрема, і на неї треба
                  підписатись самому.
                </p>
              </>
            }
          >
            {(user, signOut) => (
              <div className={styles.stack}>
                <div className={styles.head}>
                  <Reveal>
                    <span className="micro micro--bright">{user.name || user.email}</span>
                  </Reveal>
                  <button type="button" className={styles.drop} onClick={signOut}>
                    Вийти
                  </button>
                </div>

                <Orders />

                <p className="body">
                  <Link href="/cart">Перейти до кошика →</Link>
                </p>
              </div>
            )}
          </AuthGate>
        </div>
      </section>
    </>
  );
}
