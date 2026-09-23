import type { PayMethod } from "./api";

/** How each way to pay is named to the buyer. The marks are plain wordmarks,
 * not the brands' logos: they tell what the provider page will accept. */
export const PAY_INFO: Record<PayMethod, { title: string; note: string; marks: string[] }> = {
  mono: {
    title: "Карткою онлайн",
    note: "Через monobank: будь-яка картка українського чи іноземного банку, Apple Pay, Google Pay",
    marks: ["monobank", "Apple Pay", "Google Pay"],
  },
  liqpay: {
    title: "Приват24",
    note: "Через LiqPay від ПриватБанку: у застосунку Приват24 або карткою",
    marks: ["Приват24", "Visa", "Mastercard"],
  },
  iban: {
    title: "Переказ на рахунок",
    note: "IBAN-переказ з будь-якого банку. Реквізити будуть на сторінці замовлення",
    marks: ["IBAN"],
  },
  cod: {
    title: "Накладений платіж",
    note: "Оплата у відділенні Нової пошти при отриманні. Пошта бере комісію за переказ за своїми тарифами",
    marks: ["Нова пошта"],
  },
};

export const ONLINE: PayMethod[] = ["mono", "liqpay"];
