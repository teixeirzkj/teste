import { fail, handle, ok } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/catalog";
import { sendToPrinter } from "@/lib/server/printer";
import type { Order } from "@/lib/types";

/** Envia um pedido de exemplo para testar a maquininha. */
export const POST = handle(async () => {
  await requireAdmin(["admin"]);
  const now = new Date().toISOString();
  const sample: Order = {
    id: 0,
    number: 0,
    customerName: "TESTE DE IMPRESSÃO",
    phone: "(74) 99999-9999",
    deliveryType: "table",
    tableNumber: 1,
    address: { street: "", number: "", district: "", complement: "", reference: "", city: "" },
    payment: "Pix",
    changeFor: null,
    subtotal: 4000,
    deliveryFee: 0,
    total: 4000,
    cost: 0,
    status: "pending",
    origin: "mesa",
    notes: "Este é um teste — pode descartar.",
    createdAt: now,
    updatedAt: now,
    items: [{ id: 0, productId: null, name: "Pizza de teste", category: "Pizzas", size: "Pequena", qty: 1, unitPrice: 4000, addons: [], ingredients: [], flavors: [], notes: "", total: 4000 }],
  };
  const result = await sendToPrinter(sample, await getSettings(), "teste");
  return result.ok ? ok({ ok: true, result }) : fail(502, result.error ?? "Falha no teste.");
});
