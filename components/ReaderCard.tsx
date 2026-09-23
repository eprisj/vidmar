"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/seo";
import styles from "./ReaderCard.module.css";

/** Where a scanned card leads: a page that says the card is real, and since
 * when, without naming whose it is. */
export const readerUrl = (code: string) => `${SITE_URL}/r?c=${encodeURIComponent(code)}`;

// "з вересня 2026": the month in the genitive, which toLocaleDateString
// won't give with a bare month and year ("вересень 2026 р.")
const MONTHS = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
const since = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * The reader's card: a permanent code as a QR, set like a library ticket.
 * Night modules on wheat, not wheat on night: scanners read dark-on-light
 * reliably and a light-on-dark code only sometimes.
 */
export default function ReaderCard({ code, name, createdAt }: { code: string; name?: string | null; createdAt?: string }) {
  const [svg, setSvg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toString(readerUrl(code), {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 0,
      color: { dark: "#0b162bff", light: "#00000000" },
    }).then(setSvg);
  }, [code]);

  async function download() {
    const png = await QRCode.toDataURL(readerUrl(code), {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 720,
      color: { dark: "#0b162bff", light: "#f5deb3ff" },
    });
    const a = document.createElement("a");
    a.href = png;
    a.download = `vidmar-${code}.png`;
    a.click();
  }

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.brand} role="img" aria-label="ВІДЬМАР" />
        <span className={styles.kind}>картка читача</span>
      </div>

      <div className={styles.body}>
        <div className={styles.qr} role="img" aria-label={`QR-код картки ${code}`} dangerouslySetInnerHTML={{ __html: svg }} />
        <div className={styles.meta}>
          {name && <span className={styles.name}>{name}</span>}
          <span className={styles.code}>{code}</span>
          {createdAt && <span className={styles.since}>з {since(createdAt)}</span>}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            } catch {
              /* the code is on screen to copy by hand */
            }
          }}
        >
          {copied ? "Скопійовано" : "Скопіювати код"}
        </button>
        <button type="button" onClick={download}>
          Зберегти QR
        </button>
      </div>
    </div>
  );
}
