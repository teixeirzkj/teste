import "server-only";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "./auth";
import type { AdminRole } from "../types";

/** Protege uma página do painel; atendentes caem em Pedidos. */
export async function guardPage(roles: AdminRole[] = ["admin", "atendente"]) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (!roles.includes(admin.role)) redirect("/admin/pedidos");
  return admin;
}
