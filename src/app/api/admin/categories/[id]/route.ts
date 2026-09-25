import { fail, handle, idParam, ok, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { deleteCategory, updateCategory } from "@/lib/server/catalog";
import { categorySchema } from "@/lib/server/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin(["admin"]);
  const id = idParam((await ctx.params).id);
  const input = await readJson(req, categorySchema);
  const category = await updateCategory(id, input);
  return category ? ok({ category }) : fail(404, "Categoria não encontrada.");
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin(["admin"]);
  const r = await deleteCategory(idParam((await ctx.params).id));
  return r.ok ? ok({ ok: true }) : fail(409, r.error!);
});
