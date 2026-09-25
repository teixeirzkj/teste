import { MenuManager } from "@/components/admin/MenuManager";
import { guardPage } from "@/lib/server/guard";

export default async function CardapioPage() {
  await guardPage(["admin"]);
  return <MenuManager />;
}
