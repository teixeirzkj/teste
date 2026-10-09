import "server-only";
import { createHmac } from "node:crypto";
import { q } from "./db";
import { isSafeWebhook } from "./schemas";
import { buildOrderMessage } from "../whatsapp";
import type { Order, Settings } from "../types";

export type PrintEvent = "pedido_novo" | "nova_venda" | "reimpressao" | "teste";
export type PrintResult = { ok: boolean; status?: number; error?: string; event: PrintEvent; order?: number; at: string };

/** Texto do pedido para impressora térmica: igual ao do WhatsApp, sem emojis e sem a marcação de negrito/itálico. */
export function ticketText(order: Order, settings: Settings): string {
  return buildOrderMessage(order, settings)
    .replace(/[*_]/g, "")
    .replace(/\p{Extended_Pictographic}|️|‍/gu, "")
    .replace(/^ +/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function payload(order: Order, settings: Settings, event: PrintEvent) {
  return {
    evento: event,
    loja: settings.storeName,
    pedido: {
      numero: order.number,
      criado_em: order.createdAt,
      origem: order.origin,
      tipo: order.deliveryType === "table" ? "mesa" : order.deliveryType === "delivery" ? "entrega" : "retirada",
      mesa: order.tableNumber,
      cliente: order.customerName,
      telefone: order.phone,
      endereco: order.deliveryType === "delivery" ? order.address : null,
      itens: order.items.map((i) => ({
        quantidade: i.qty,
        nome: i.name,
        tamanho: i.size,
        sabores: i.flavors.map((f) => f.name),
        adicionais: i.addons.map((a) => a.name),
        observacoes: i.notes,
        valor: i.total / 100,
      })),
      subtotal: order.subtotal / 100,
      taxa_entrega: order.deliveryFee / 100,
      total: order.total / 100,
      pagamento: order.payment,
      troco_para: order.changeFor ? order.changeFor / 100 : null,
      observacoes: order.notes,
    },
    /** Pronto para imprimir em impressora térmica. */
    texto: ticketText(order, settings),
    /** Mesmo texto enviado ao WhatsApp (com formatação). */
    texto_whatsapp: buildOrderMessage(order, settings),
  };
}

/**
 * Envia o pedido para o webhook da maquininha/impressora.
 * Corpo JSON assinado com HMAC-SHA256 (cabeçalho X-Pizzaria-Assinatura) quando há token,
 * que também vai como "Authorization: Bearer <token>".
 */
export async function sendToPrinter(order: Order, settings: Settings, event: PrintEvent): Promise<PrintResult> {
  const at = new Date().toISOString();
  const url = settings.printWebhookUrl;
  let result: PrintResult;
  if (!url) {
    result = { ok: false, error: "Impressão não configurada. Informe o endereço da maquininha em Configurações.", event, order: order.number, at };
  } else if (!isSafeWebhook(url)) {
    result = { ok: false, error: "Endereço da maquininha inválido.", event, order: order.number, at };
  } else {
    const body = JSON.stringify(payload(order, settings, event));
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "PizzariaSaoPaulo-Impressao/1.0",
      "X-Pizzaria-Evento": event,
    };
    const token = settings.printWebhookToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers["X-Pizzaria-Assinatura"] = `sha256=${createHmac("sha256", token).update(body).digest("hex")}`;
    }
    try {
      const res = await fetch(url, { method: "POST", headers, body, redirect: "manual", signal: AbortSignal.timeout(8000) });
      result = res.ok
        ? { ok: true, status: res.status, event, order: order.number, at }
        : { ok: false, status: res.status, error: `A maquininha respondeu com erro (HTTP ${res.status}).`, event, order: order.number, at };
    } catch (e) {
      const timeout = e instanceof Error && e.name === "TimeoutError";
      result = { ok: false, error: timeout ? "A maquininha não respondeu a tempo (8 s)." : "Não foi possível conectar à maquininha.", event, order: order.number, at };
    }
  }
  // Guarda o último envio para mostrar em Configurações.
  await q("INSERT INTO meta (key, value) VALUES ('print_last', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [JSON.stringify(result)]).catch(() => {});
  if (!result.ok) console.error("[impressão]", result);
  return result;
}

export async function lastPrintResult(): Promise<PrintResult | null> {
  const [r] = await q<{ value: string }>("SELECT value FROM meta WHERE key = 'print_last'");
  try {
    return r ? (JSON.parse(r.value) as PrintResult) : null;
  } catch {
    return null;
  }
}
