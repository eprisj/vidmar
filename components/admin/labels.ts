export const ORDER_STATUS: Record<string, string> = {
  awaiting_payment: "Очікує оплати",
  paid: "Оплачено",
  shipped: "Відправлено",
  fulfilled: "Виконано",
  cancelled: "Скасовано",
};

export const ORDER_FLOW = ["awaiting_payment", "paid", "shipped", "fulfilled", "cancelled"];

export const SUBMISSION_STATUS: Record<string, string> = {
  new: "Новий",
  reading: "Читаємо",
  accepted: "Прийнято",
  declined: "Відхилено",
};

export const uah = (cents: number | string | null | undefined) =>
  cents == null
    ? "–"
    : new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(
        Number(cents) / 100,
      );

export const when = (iso: string | null | undefined, time = true) =>
  iso
    ? new Date(iso).toLocaleString("uk-UA", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    : "–";
