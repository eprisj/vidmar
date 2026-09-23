import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";

/** The admin pages are client components, so they could not name themselves and
 * inherited the site-wide title while staying indexable like any other page. */
export const metadata: Metadata = {
  title: "Адміністрування – ВІДЬМАР",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
