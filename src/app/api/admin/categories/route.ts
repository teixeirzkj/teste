import { handle, ok, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { createCategory, listCategories } from "@/lib/server/catalog";
import { categorySchema } from "@/lib/server/schemas";

export const GET = handle(async () => {
  await requireAdmin();
  return ok({ categories: await listCategories() });
});

export const POST = handle(async (req: Request) => {
  await requireAdmin(["admin"]);
  const input = await readJson(req, categorySchema);
  return ok({ category: await createCategory(input) }, { status: 201 });
});
