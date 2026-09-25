import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentAdmin } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/catalog";
import { countPending } from "@/lib/server/orders";

export const metadata: Metadata = { title: "Painel — Pizzaria São Paulo", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const s = await getSettings();
  return (
    <AdminShell admin={admin} logo={s.logo} storeName={s.storeName} initialPending={await countPending()} initialOpen={s.isOpen}>
      {children}
    </AdminShell>
  );
}
