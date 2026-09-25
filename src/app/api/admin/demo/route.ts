import { handle, ok } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { clearDemoOrders, countDemoOrders } from "@/lib/server/orders";

export const GET = handle(async () => {
  await requireAdmin(["admin"]);
  return ok({ count: await countDemoOrders() });
});

export const DELETE = handle(async () => {
  await requireAdmin(["admin"]);
  return ok({ removed: await clearDemoOrders() });
});
