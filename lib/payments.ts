import type { PayMethod } from "./api";

/** How each way to pay is named to the buyer, with its own mark where the
 * method has one (the brands' logos, from Wikimedia Commons). */
export const PAY_INFO: Record<PayMethod, { title: string; logo: string | null }> = {
  mono: { title: "Картка через monobank", logo: "/pay/monobank.svg" },
  liqpay: { title: "Приват24", logo: "/pay/privat24.webp" },
  iban: { title: "Переказ на рахунок", logo: null },
  cod: { title: "Накладений платіж", logo: "/pay/np-mark.webp" },
};

export const ONLINE: PayMethod[] = ["mono", "liqpay"];
