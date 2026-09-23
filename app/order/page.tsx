"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FORMAT_LABEL, formatPrice, lookupOrder, type PublicOrder } from "@/lib/api";
import styles from "../cart/cart.module.css";

const STATUS: Record<string, string> = {
  awaiting_payment: "Очікує оплати",
  paid: "Оплачено, готуємо",
  shipped: "Відправлено",
  fulfilled: "Виконано",
  cancelled: "Скасовано",
};

function OrderView() {
  const params = useSearchParams();
  const [order, setOrder] = useState<PublicOrder | null | undefined>(undefined);

  useEffect(() => {
    lookupOrder(params.get("id") || "", params.get("t") || "").then(setOrder);
  }, [params]);

  if (order === undefined) return null;
  if (order === null)
    return (
      <div className={styles.emptyCart}>
        <p className="body">Замовлення не знайдено. Перевірте посилання.</p>
        <Link className="pill" href="/catalog">
          До каталогу
        </Link>
      </div>
    );

  return (
    <div className={styles.done}>
      <span className="micro micro--bright">замовлення №{order.id}</span>
      <h1 className={styles.h1}>{STATUS[order.status] ?? order.status}</h1>
      {order.is_demo && <p className={styles.hint}>Це демонстраційне замовлення, оплачувати його не потрібно.</p>}
      <ul className={styles.lines} style={{ width: "100%" }}>
        {order.items.map((i, k) => (
          <li key={k} className={styles.line} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
            <div className={styles.lineInfo}>
              <span className={styles.lineTitle}>{i.title}</span>
              <span className={styles.lineMeta}>
                {FORMAT_LABEL[i.format]}
                {i.quantity > 1 && ` × ${i.quantity}`}
              </span>
            </div>
            <span className={styles.lineSum}>{formatPrice(i.price_cents * i.quantity, order.currency)}</span>
          </li>
        ))}
      </ul>
      <div className={styles.sum} style={{ width: "100%" }}>
        <span>Разом</span>
        <strong>{formatPrice(order.total_cents, order.currency)}</strong>
      </div>
      {order.np_warehouse && (
        <p className="body">
          Нова пошта: {order.np_city}, {order.np_warehouse}
          {order.ttn && (
            <>
              <br />
              Номер накладної: <b>{order.ttn}</b>
            </>
          )}
        </p>
      )}
    </div>
  );
}

export default function OrderPage() {
  return (
    <section className={styles.root} data-field="dark">
      <div className="wrapMax">
        <Suspense fallback={null}>
          <OrderView />
        </Suspense>
      </div>
    </section>
  );
}
