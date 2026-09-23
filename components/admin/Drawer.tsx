"use client";

import { useEffect } from "react";
import s from "./admin.module.css";

/** A panel from the right edge for one record; Esc or the scrim closes it. */
export default function Drawer({
  title,
  sub,
  onClose,
  children,
  foot,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  foot?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <>
      <div className={s.scrim} onClick={onClose} />
      <aside className={s.drawer} role="dialog" aria-modal="true">
        <div className={s.drawerHead}>
          <div>
            <h2 className={s.h1} style={{ fontSize: "1.3rem" }}>
              {title}
            </h2>
            {sub && <p className={s.sub}>{sub}</p>}
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Закрити">
            <svg viewBox="0 0 24 24" width="20" height="20" className={s.icon} aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className={s.drawerBody}>{children}</div>
        {foot && <div className={s.drawerFoot}>{foot}</div>}
      </aside>
    </>
  );
}
