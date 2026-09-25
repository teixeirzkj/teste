import { z } from "zod";
import { handle, idParam, ok, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { updateOrderStatus } from "@/lib/server/orders";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ status: z.enum(["pending", "preparing", "delivering", "done", "canceled"]) });

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const id = idParam((await ctx.params).id);
  const { status } = await readJson(req, schema);
  return ok({ order: await updateOrderStatus(id, status) });
});
