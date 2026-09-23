"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import forest from "@/assets/forest/mid.svg";
import styles from "./Header.module.css";

const nav = [
  { href: "/about", label: "Про нас" },
  { href: "/genres", label: "Напрями" },
  { href: "/catalog", label: "Каталог" },
  { href: "/submissions", label: "Авторам" },
  { href: "/journal", label: "Журнал" },
  { href: "/account", label: "Кабінет" },
];

export default function Header() {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [onPage, setOnPage] = useState(false);
  const [open, setOpen] = useState(false);

  const sync = useCallback(() => {
    setSolid(window.scrollY > 40);
    // read the field sitting directly behind the bar
    const probe = document.elementsFromPoint(window.innerWidth / 2, 40);
    const field = probe.find(
      (el) => el instanceof HTMLElement && el.dataset.field,
    ) as HTMLElement | undefined;
    setOnPage(field?.dataset.field === "light");
  }, []);

  // once per frame at most: elementsFromPoint forces a layout, and running
  // it on every scroll event made the whole page stutter under the bar
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sync();
      });
    };
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sync]);

  useEffect(() => {
    setOpen(false);
    const id = window.setTimeout(sync, 60);
    return () => window.clearTimeout(id);
  }, [pathname, sync]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("is-loading");
    return () => document.body.classList.remove("is-loading");
  }, [open]);

  return (
    <>
      <header
        className={`${styles.root} ${solid || open ? styles.solid : ""} ${
          onPage && !open ? styles.onPage : ""
        } ${open ? styles.isOpen : ""}`}
      >
        <div className={`wrapMax ${styles.bar}`}>
          <Link href="/" className={styles.brand} aria-label="ВІДЬМАР – на головну">
            <span className={styles.mark} role="img" aria-label="ВІДЬМАР" />
          </Link>

          <nav className={styles.nav}>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-on={pathname.startsWith(item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.tools}>
            <button
              type="button"
              className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
              aria-label={open ? "Закрити меню" : "Меню"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* rendered as a sibling, never inside <header>: a backdrop-filtered
          header would become the containing block for this fixed panel and
          collapse it to the header's own (tiny) height */}
      <div
        className={`${styles.menu} ${open ? styles.menuOpen : ""}`}
        aria-hidden={!open}
      >
        {/* the same night the home page opens on: a stand of trees along
            the foot of the menu */}
        <span className={styles.menuMoon} aria-hidden="true" />
        <img
          className={styles.menuForest}
          src={forest.src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />

        <nav className={styles.menuNav}>
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={open ? undefined : -1}
              /* the panel is hidden with visibility, which still counts as
                 on-screen to the prefetch observer: closed, it was pulling a
                 payload for all five routes on every phone visit */
              prefetch={false}
              style={{ transitionDelay: open ? `${80 + i * 60}ms` : "0ms" }}
              data-on={pathname.startsWith(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
