import { handle, ok, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { createProduct, listCategories, listProducts } from "@/lib/server/catalog";
import { productSchema } from "@/lib/server/schemas";

export const GET = handle(async () => {
  await requireAdmin();
  return ok({ products: await listProducts(), categories: await listCategories() });
});

export const POST = handle(async (req: Request) => {
  await requireAdmin(["admin"]);
  const input = await readJson(req, productSchema);
  return ok({ product: await createProduct(input) }, { status: 201 });
});
