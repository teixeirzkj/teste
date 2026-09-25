import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/catalog";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Entrar — Painel Pizzaria São Paulo", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  const s = await getSettings();
  return <LoginForm logo={s.logo} storeName={s.storeName} showDefault={process.env.NODE_ENV !== "production"} />;
}
