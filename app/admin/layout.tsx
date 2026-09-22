import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

/** The admin pages are client components, so they could not name themselves and
 * inherited the site-wide title while staying indexable like any other page. */
export const metadata: Metadata = {
  title: "Адміністрування – ВІДЬМАР",
  robots: { index: false, follow: false },
};

const tabs = [
  { href: "/admin/books", label: "Книги" },
  { href: "/admin/users", label: "Користувачі" },
  { href: "/admin/orders", label: "Замовлення" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <nav
        style={{
          display: "flex",
          gap: 4,
          padding: "12px 40px",
          borderBottom: "1px solid #ddd",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            style={{ padding: "6px 12px", fontSize: 13, textDecoration: "none", color: "#333" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
