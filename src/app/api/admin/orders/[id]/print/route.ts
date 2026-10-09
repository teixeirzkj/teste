import { fail, handle, idParam, ok } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/catalog";
import { getOrder } from "@/lib/server/orders";
import { sendToPrinter } from "@/lib/server/printer";

type Ctx = { params: Promise<{ id: string }> };

/** Botão "Imprimir" do pedido: reenvia para a maquininha. */
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const order = await getOrder(idParam((await ctx.params).id));
  if (!order) return fail(404, "Pedido não encontrado.");
  const result = await sendToPrinter(order, await getSettings(), "reimpressao");
  return result.ok ? ok({ ok: true }) : fail(502, result.error ?? "Falha ao imprimir.");
});
