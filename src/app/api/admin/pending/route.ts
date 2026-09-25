import { handle, ok } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/catalog";
import { countPending } from "@/lib/server/orders";

export const GET = handle(async () => {
  await requireAdmin();
  return ok({ pending: await countPending(), isOpen: (await getSettings()).isOpen });
});
