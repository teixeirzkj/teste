import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { guardPage } from "@/lib/server/guard";

export default async function PedidosPage() {
  await guardPage();
  return <OrdersBoard />;
}
