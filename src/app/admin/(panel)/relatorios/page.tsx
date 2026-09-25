import { Reports } from "@/components/admin/Reports";
import { guardPage } from "@/lib/server/guard";

export default async function RelatoriosPage() {
  await guardPage(["admin"]);
  return <Reports />;
}
