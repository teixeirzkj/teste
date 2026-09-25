import { fail, handle, idParam, ok, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { deleteProduct, patchProductFlags, updateProduct } from "@/lib/server/catalog";
import { productFlagsSchema, productSchema } from "@/lib/server/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin(["admin"]);
  const id = idParam((await ctx.params).id);
  const input = await readJson(req, productSchema);
  const product = await updateProduct(id, input);
  return product ? ok({ product }) : fail(404, "Produto não encontrado.");
});

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin(["admin"]);
  const id = idParam((await ctx.params).id);
  const flags = await readJson(req, productFlagsSchema);
  const product = await patchProductFlags(id, flags);
  return product ? ok({ product }) : fail(404, "Produto não encontrado.");
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin(["admin"]);
  await deleteProduct(idParam((await ctx.params).id));
  return ok({ ok: true });
});
