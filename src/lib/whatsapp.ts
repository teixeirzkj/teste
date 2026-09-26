import { money } from "./format";
import type { Order, Settings } from "./types";

/** Monta a mensagem completa do pedido para o WhatsApp da pizzaria. */
export function buildOrderMessage(order: Order, settings: Settings): string {
  const L: string[] = [];
  const header = settings.whatsappHeader?.trim() || `🍕 *NOVO PEDIDO — ${settings.storeName.toUpperCase()}*`;
  L.push(header);
  L.push(`🧾 *Pedido nº ${order.number}*`);
  L.push("");
  L.push(`👤 *Cliente:* ${order.customerName}`);
  L.push(`📱 *Telefone:* ${order.phone}`);
  L.push("");
  L.push("📦 *Pedido:*");
  for (const it of order.items) {
    L.push("");
    const size = it.size && it.size !== "Único" ? ` — ${it.size}` : "";
    L.push(`*${it.qty}x ${it.name}${size}* (${money(it.total)})`);
    if (it.flavors?.length) {
      const frac = `1/${it.flavors.length}`;
      for (const f of it.flavors) L.push(`🍕 ${frac} ${f.name}${f.description ? ` — _${f.description}_` : ""}`);
    } else if (it.ingredients.length) L.push(`_${it.ingredients.join(", ")}_`);
    if (it.addons.length) {
      L.push("➕ *Adicionais:*");
      for (const a of it.addons) L.push(`- ${a.name} (+${money(a.price)})`);
    }
    if (it.notes) L.push(`📝 *Obs:* ${it.notes}`);
  }
  L.push("");
  L.push(`💰 *Subtotal:* ${money(order.subtotal)}`);
  if (order.deliveryType === "delivery") L.push(`🚚 *Taxa de entrega:* ${money(order.deliveryFee)}`);
  L.push(`💵 *Total:* ${money(order.total)}`);
  L.push("");
  if (order.deliveryType === "delivery") {
    const a = order.address;
    L.push("📍 *ENDEREÇO*");
    L.push(`Rua: ${a.street}`);
    L.push(`Número: ${a.number}`);
    L.push(`Bairro: ${a.district}`);
    if (a.complement) L.push(`Complemento: ${a.complement}`);
    if (a.reference) L.push(`Referência: ${a.reference}`);
    if (a.city) L.push(`Cidade: ${a.city}`);
  } else {
    L.push("🏪 *Retirada no local*");
  }
  L.push("");
  L.push(`💳 *Pagamento:* ${order.payment}`);
  if (order.changeFor) L.push(`💵 *Troco para:* ${money(order.changeFor)}`);
  if (order.notes) {
    L.push("");
    L.push(`📝 *Observações:* ${order.notes}`);
  }
  if (settings.whatsappFooter?.trim()) {
    L.push("");
    L.push(settings.whatsappFooter.trim());
  }
  return L.join("\n");
}
