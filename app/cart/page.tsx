"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import AuthGate from "@/components/AuthGate";
import { useToast } from "@/components/ToastProvider";
import { apiMessage, checkout, formatPrice, getCart, removeFromCart, type CartItem } from "@/lib/api";
import styles from "@/components/Shop.module.css";

function CartContents() {
  const toast = useToast();
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [busy, setBusy] = useState(false);

  function refresh() {
    getCart().then(setItems);
  }

  useEffect(refresh, []);

  if (items === null) return null;

  if (items.length === 0) {
    return (
      <p className={`body ${styles.note}`}>
        Кошик порожній. Перша книга ще готується – щойно вона з’явиться в{" "}
        <Link href="/catalog">каталозі</Link>, її можна буде відкласти сюди.
      </p>
    );
  }

  const total = items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);

  return (
    <div className={styles.stack}>
      <ul className={styles.list}>
        {items.map((i) => (
          <li key={i.slug} className={styles.row}>
            <span className={styles.rowName}>
              {i.title}
              {i.quantity > 1 && ` × ${i.quantity}`}
            </span>
            <span className={styles.rowMeta}>
              <span>{formatPrice(i.price_cents * i.quantity, i.currency)}</span>
              <button
                type="button"
                className={styles.drop}
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

      <div className={`${styles.total} body`}>
        <span>Разом</span>
        <strong>{formatPrice(total, items[0].currency)}</strong>
      </div>

      <div className={styles.stack}>
        <button
          type="button"
          className="pill pill--solid"
          style={{ justifySelf: "start" }}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await checkout();
              toast("замовлення оформлено – реквізити надішлемо на пошту");
              refresh();
            } catch (err) {
              toast(apiMessage(err, "не вдалося оформити замовлення"));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "оформлюємо…" : "Оформити замовлення"}
        </button>
        <p className={`body ${styles.note}`}>
          Після оформлення ми надішлемо реквізити для переказу на вашу пошту.
          Картковий платіж просто на сайті з’явиться пізніше – замовлення до того
          часу чекає в{" "}
          <Link href="/account">кабінеті</Link> зі станом «очікує оплати».
        </p>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <>
      <PageHero
        label="Кошик"
        title="Ваш кошик"
        lede="Книги, які ви відклали. Оплата поки відбувається переказом – реквізити приходять на пошту після оформлення."
        variant={1}
      />

      <section className="ink padS" data-field="dark" data-candle="">
        <div className="wrapMax">
          <AuthGate
            aside={
              <>
                <p>
                  Кошик прив’язаний до акаунта, тому переживе і закриту вкладку,
                  і інший пристрій.
                </p>
                <p>
                  Каталог поки порожній: перше видання готується, і кнопка «у
                  кошик» з’явиться на книзі разом із ціною.
                </p>
              </>
            }
          >
            {() => <CartContents />}
          </AuthGate>
        </div>
      </section>
    </>
  );
}
