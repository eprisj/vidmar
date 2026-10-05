"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/seo";
import styles from "./ReaderCard.module.css";

/** Where a scanned card leads: a page that says the card is real, and since
 * when, without naming whose it is. */
export const readerUrl = (code: string) =>
  `${SITE_URL}/r?c=${encodeURIComponent(code)}`;

// "з вересня 2026": the month in the genitive, which toLocaleDateString
// won't give with a bare month and year ("вересень 2026 р.")
const MONTHS = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];
export const since = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const NIGHT = "#0b162b";
const INK = "#162e59";
const WHEAT = "#f5deb3";
const PAPER = "#f9ecd2";
const FONT = "Golos Text, Helvetica, Arial, sans-serif";

/** The card as a picture (1012×638, a bank card at 300 dpi): for the phone's
 * photos, so it opens at a counter without signing in. */
async function cardPng(code: string, name?: string | null, createdAt?: string) {
  const W = 1012,
    H = 638;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.beginPath();
  g.roundRect(0, 0, W, H, 44);
  g.clip();
  g.fillStyle = WHEAT;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W, 0, 0, W, 0, W * 0.8);
  glow.addColorStop(0, "rgba(201,169,97,.45)");
  glow.addColorStop(1, "rgba(201,169,97,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  // night band with the wordmark in wheat
  g.fillStyle = INK;
  g.fillRect(0, 0, W, 132);
  try {
    const logo = new Image();
    logo.src = "/logo-mark.png";
    await logo.decode();
    const h = 56,
      w = (logo.naturalWidth / logo.naturalHeight) * h;
    const t = document.createElement("canvas");
    t.width = Math.ceil(w);
    t.height = h;
    const tg = t.getContext("2d")!;
    tg.drawImage(logo, 0, 0, w, h);
    tg.globalCompositeOperation = "source-in";
    tg.fillStyle = WHEAT;
    tg.fillRect(0, 0, w, h);
    g.drawImage(t, 56, 38);
  } catch {
    g.fillStyle = WHEAT;
    g.font = `700 44px ${FONT}`;
    g.fillText("ВІДЬМАР", 56, 84);
  }
  g.fillStyle = WHEAT;
  g.font = `600 26px ${FONT}`;
  g.textAlign = "right";
  g.fillText("КАРТКА ЧИТАЧА", W - 56, 76);
  g.textAlign = "left";
  // QR on paper
  g.fillStyle = PAPER;
  g.beginPath();
  g.roundRect(56, 176, 380, 380, 24);
  g.fill();
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, readerUrl(code), {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 332,
    color: { dark: NIGHT + "ff", light: "#00000000" },
  });
  g.drawImage(qr, 80, 200, 332, 332);
  let y = 250;
  g.fillStyle = INK;
  if (name) {
    g.font = `600 40px ${FONT}`;
    let n = name;
    while (g.measureText(n).width > W - 540 && n.length > 3)
      n = n.slice(0, -2) + "…";
    g.fillText(n, 480, y);
    y += 74;
  }
  g.font = `700 52px ${FONT}`;
  g.fillText(code, 480, y);
  y += 60;
  if (createdAt) {
    g.fillStyle = "rgba(22,46,89,.7)";
    g.font = `500 28px ${FONT}`;
    g.fillText(`читач з ${since(createdAt)}`, 480, y);
  }
  g.fillStyle = "rgba(22,46,89,.55)";
  g.font = `500 22px ${FONT}`;
  g.fillText("vidmar.com.ua/r – перевірка картки", 480, 540);
  return c.toDataURL("image/png");
}

/**
 * The reader's card: a permanent code as a QR, set like a library ticket.
 * Night modules on wheat, not wheat on night: scanners read dark-on-light
 * reliably and a light-on-dark code only sometimes.
 */
export default function ReaderCard({
  code,
  name,
  createdAt,
}: {
  code: string;
  name?: string | null;
  createdAt?: string;
}) {
  const [svg, setSvg] = useState("");
  const [note, setNote] = useState("");
  const [big, setBig] = useState(false);
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    QRCode.toString(readerUrl(code), {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 0,
      color: { dark: NIGHT + "ff", light: "#00000000" },
    }).then(setSvg);
  }, [code]);

  const say = useCallback((text: string) => {
    setNote(text);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(""), 2400);
  }, []);

  // the big QR: Esc closes, focus on its close button, page does not scroll
  useEffect(() => {
    if (!big) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBig(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [big]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      say("Код скопійовано");
    } catch {
      say("Не вдалося скопіювати – код є на картці");
    }
  }

  async function share() {
    const url = readerUrl(code);
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Картка читача ВІДЬМАР",
          text: `Картка читача ${code}`,
          url,
        });
      } catch {
        /* the sheet was closed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      say("Посилання для перевірки скопійовано");
    } catch {
      say(url);
    }
  }

  async function download() {
    try {
      const a = document.createElement("a");
      a.href = await cardPng(code, name, createdAt);
      a.download = `vidmar-${code}.png`;
      a.click();
      say("Картку збережено");
    } catch {
      say("Не вдалося зберегти картку");
    }
  }

  const [head, ...rest] = code.split("-");

  return (
    <div className={styles.wrap}>
      <div
        className={styles.card}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          // a slight tilt and a foil glint that follow the mouse, like a card in the hand
          const r = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          const st = e.currentTarget.style;
          st.setProperty("--mx", `${x * 100}%`);
          st.setProperty("--my", `${y * 100}%`);
          st.setProperty("--rx", `${(0.5 - y) * 6}deg`);
          st.setProperty("--ry", `${(x - 0.5) * 8}deg`);
        }}
        onPointerLeave={(e) => {
          const st = e.currentTarget.style;
          ["--mx", "--my", "--rx", "--ry"].forEach((k) => st.removeProperty(k));
        }}
      >
        <span className={styles.sheen} aria-hidden="true" />
        <svg className={styles.seal} viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="38" />
          <path d="M58 30a22 22 0 1 0 0 40a18 18 0 1 1 0-40z" />
          <path d="M72 42l1.6 3.4 3.7.5-2.7 2.6.6 3.7-3.2-1.8-3.3 1.8.7-3.7-2.7-2.6 3.7-.5z" />
        </svg>
        <div className={styles.band}>
          <span className={styles.brand} role="img" aria-label="ВІДЬМАР" />
          <span className={styles.kind}>картка читача</span>
        </div>

        <div className={styles.body}>
          <button
            type="button"
            className={styles.qr}
            onClick={() => setBig(true)}
            aria-label={`Показати QR-код картки ${code} на весь екран`}
            title="На весь екран – для сканування"
          >
            <span
              className={styles.qrImg}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <span className={styles.zoom} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </svg>
            </span>
          </button>
          <div className={styles.meta}>
            {name && <span className={styles.name}>{name}</span>}
            <span className={styles.code}>
              <span className={styles.prefix}>{head}</span>
              {rest.map((p, i) => (
                <span key={i}>{p}</span>
              ))}
            </span>
            {createdAt && (
              <span className={styles.since}>читач з {since(createdAt)}</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={copy}>
          Скопіювати код
        </button>
        <button type="button" onClick={share}>
          Поділитися
        </button>
        <button type="button" onClick={download} className={styles.wide}>
          Зберегти картку в галерею
        </button>
      </div>

      <p className={styles.hint}>
        Покажіть QR-код на ярмарку чи в книгарні: за ним перевіряють, що картка
        справжня. Ваше ім&apos;я та пошта під час перевірки не показуються.
      </p>
      <p className={styles.note} role="status" aria-live="polite">
        {note}
      </p>

      {big &&
        createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-label="QR-код картки читача"
            onClick={() => setBig(false)}
          >
            <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <div
                className={styles.bigQr}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <span className={styles.bigCode}>{code}</span>
              <span className={styles.bigHint}>
                Якщо сканер не бачить код, додайте яскравості екрана
              </span>
              <button
                ref={closeRef}
                type="button"
                className={styles.close}
                onClick={() => setBig(false)}
              >
                Закрити
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
