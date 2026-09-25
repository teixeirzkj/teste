import { fail, handle, ok, readJson } from "@/lib/server/api";
import { getSettings } from "@/lib/server/catalog";
import { createOrder, orderSchema } from "@/lib/server/orders";
import { clientIp, rateLimit } from "@/lib/server/ratelimit";
import { buildOrderMessage } from "@/lib/whatsapp";
import { waLink } from "@/lib/format";

export const POST = handle(async (req: Request) => {
  if (!await rateLimit(`order:${clientIp(req)}`, 8, 10 * 60 * 1000)) {
    return fail(429, "Muitos pedidos em pouco tempo. Aguarde alguns minutos ou chame no WhatsApp.");
  }
  const input = await readJson(req, orderSchema);
  const order = await createOrder(input, { origin: "site", status: "pending", enforceStore: true });
  const settings = await getSettings();
  const message = buildOrderMessage(order, settings);
  return ok({
    order: {
      number: order.number,
      total: order.total,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      deliveryType: order.deliveryType,
      payment: order.payment,
      customerName: order.customerName,
    },
    whatsappUrl: waLink(settings.whatsapp, message),
  });
});
