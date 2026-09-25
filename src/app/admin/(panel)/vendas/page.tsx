import { SalesTable } from "@/components/admin/SalesTable";
import { guardPage } from "@/lib/server/guard";

export default async function VendasPage() {
  await guardPage();
  return <SalesTable />;
}
