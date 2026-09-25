import { handle, ok, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { reorder } from "@/lib/server/catalog";
import { reorderSchema } from "@/lib/server/schemas";

export const POST = handle(async (req: Request) => {
  await requireAdmin(["admin"]);
  const { table, ids } = await readJson(req, reorderSchema);
  await reorder(table, ids);
  return ok({ ok: true });
});
