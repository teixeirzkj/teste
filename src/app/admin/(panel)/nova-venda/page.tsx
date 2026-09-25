import { NewSale } from "@/components/admin/NewSale";
import { guardPage } from "@/lib/server/guard";

export default async function NovaVendaPage() {
  await guardPage();
  return <NewSale />;
}
