import "server-only";
import { z } from "zod";
import { iso, json, q, tx, type Param, type Row } from "./db";
import { getSettings, listCategories, rowToProduct } from "./catalog";
import { formatPhone } from "../format";
import type { Addon, Address, Order, OrderItem, OrderOrigin, OrderStatus } from "../types";

const str = (max: number) => z.string().trim().max(max);

export const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  size: str(60),
  qty: z.number().int().min(1).max(50),
  addons: z.array(str(80)).max(20).default([]),
  notes: str(300).default(""),
});

export const orderSchema = z.object({
  customerName: str(100).min(2, "Informe seu nome completo."),
  phone: str(20).refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone válido com DDD."),
  deliveryType: z.enum(["delivery", "pickup"]),
  address: z
    .object({
      street: str(120).default(""),
      number: str(20).default(""),
      district: str(80).default(""),
      complement: str(120).default(""),
      reference: str(160).default(""),
      city: str(80).default(""),
    })
    .default({ street: "", number: "", district: "", complement: "", reference: "", city: "" }),
  payment: str(60).min(1, "Escolha a forma de pagamento."),
  changeFor: z.number().int().min(0).max(10_000_00).nullable().default(null),
  notes: str(400).default(""),
  items: z.array(orderItemSchema).min(1, "Seu carrinho está vazio.").max(60),
});

export const adminOrderSchema = orderSchema.extend({
  origin: z.enum(["site", "balcao", "telefone", "whatsapp"]).default("balcao"),
  status: z.enum(["pending", "preparing", "delivering", "done"]).default("preparing"),
  deliveryFee: z.number().int().min(0).max(1000_00).nullable().default(null),
  phone: str(20).default(""),
  customerName: str(100).min(1, "Informe o nome do cliente."),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type AdminOrderInput = z.infer<typeof adminOrderSchema>;

export class OrderError extends Error {}

function rowToItem(r: Row): OrderItem {
  return {
    id: Number(r.id),
    productId: r.product_id == null ? null : Number(r.product_id),
    name: String(r.name),
    category: String(r.category ?? ""),
    size: String(r.size ?? ""),
    qty: Number(r.qty),
    unitPrice: Number(r.unit_price),
    addons: json<Addon[]>(r.addons, []),
    ingredients: json<string[]>(r.ingredients, []),
    notes: String(r.notes ?? ""),
    total: Number(r.total),
  };
}

const EMPTY_ADDRESS: Address = { street: "", number: "", district: "", complement: "", reference: "", city: "" };

function rowToOrder(r: Row, items: OrderItem[]): Order {
  return {
    id: Number(r.id),
    number: Number(r.number),
    customerName: String(r.customer_name),
    phone: String(r.phone),
    deliveryType: r.delivery_type as Order["deliveryType"],
    address: { ...EMPTY_ADDRESS, ...json<Partial<Address>>(r.address, {}) },
    payment: String(r.payment),
    changeFor: r.change_for == null ? null : Number(r.change_for),
    subtotal: Number(r.subtotal),
    deliveryFee: Number(r.delivery_fee),
    total: Number(r.total),
    cost: Number(r.cost),
    status: r.status as OrderStatus,
    origin: r.origin as OrderOrigin,
    notes: String(r.notes ?? ""),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    items,
  };
}

async function attachItems(rows: Row[]): Promise<Order[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => Number(r.id));
  // Lista de ids passada como um único parâmetro JSON.
  const itemRows = await q(
    "SELECT * FROM order_items WHERE order_id IN (SELECT jsonb_array_elements_text($1::text::jsonb)::int) ORDER BY id",
    [JSON.stringify(ids)]
  );
  const byOrder = new Map<number, OrderItem[]>();
  for (const ir of itemRows) {
    const k = Number(ir.order_id);
    if (!byOrder.has(k)) byOrder.set(k, []);
    byOrder.get(k)!.push(rowToItem(ir));
  }
  return rows.map((r) => rowToOrder(r, byOrder.get(Number(r.id)) ?? []));
}

export async function getOrder(id: number): Promise<Order | null> {
  const [r] = await q("SELECT * FROM orders WHERE id = $1", [id]);
  return r ? (await attachItems([r]))[0] : null;
}

export async function listOrders(opts: { fromISO?: string; toISO?: string; statuses?: OrderStatus[]; limit?: number } = {}): Promise<Order[]> {
  const where: string[] = [];
  const params: Param[] = [];
  if (opts.fromISO) {
    params.push(opts.fromISO);
    where.push(`created_at >= $${params.length}::timestamptz`);
  }
  if (opts.toISO) {
    params.push(opts.toISO);
    where.push(`created_at < $${params.length}::timestamptz`);
  }
  if (opts.statuses?.length) {
    params.push(JSON.stringify(opts.statuses));
    where.push(`status IN (SELECT jsonb_array_elements_text($${params.length}::text::jsonb))`);
  }
  const limit = opts.limit ? ` LIMIT ${Math.max(1, Math.floor(opts.limit))}` : "";
  const sql = `SELECT * FROM orders ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC${limit}`;
  return attachItems(await q(sql, params));
}

/** Pedidos do quadro: todos em andamento + finalizados/cancelados das últimas 24h. */
export async function listBoardOrders(): Promise<Order[]> {
  const rows = await q(
    `SELECT * FROM orders WHERE status IN ('pending','preparing','delivering')
     OR (status IN ('done','canceled') AND updated_at >= NOW() - INTERVAL '24 hours') ORDER BY created_at DESC LIMIT 400`
  );
  return attachItems(rows);
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["preparing", "canceled"],
  preparing: ["delivering", "done", "canceled", "pending"],
  delivering: ["done", "canceled", "preparing"],
  done: ["delivering"],
  canceled: ["pending"],
};

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  const cur = await getOrder(id);
  if (!cur) throw new OrderError("Pedido não encontrado.");
  if (cur.status !== status && !NEXT_STATUS[cur.status].includes(status)) {
    throw new OrderError("Mudança de status não permitida.");
  }
  await q("UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2", [status, id]);
  return (await getOrder(id))!;
}

type CreateOpts = {
  origin: OrderOrigin;
  status: OrderStatus;
  enforceStore: boolean; // pedidos do site respeitam loja aberta, pagamento ativo e pedido mínimo
  deliveryFeeOverride?: number | null;
};

/** Cria o pedido recalculando TODOS os valores a partir do banco. */
export async function createOrder(input: OrderInput, opts: CreateOpts): Promise<Order> {
  const settings = await getSettings();
  if (opts.enforceStore && !settings.isOpen) throw new OrderError(settings.closedMessage || "Estamos fechados no momento.");

  const payment = settings.payments.find((p) => p.name === input.payment && (p.active || !opts.enforceStore));
  if (!payment && opts.enforceStore) throw new OrderError("Forma de pagamento indisponível.");

  if (input.deliveryType === "delivery" && opts.enforceStore) {
    const a = input.address;
    if (!a.street || !a.number || !a.district) throw new OrderError("Preencha rua, número e bairro para a entrega.");
  }

  const allCats = await listCategories();
  const activeCats = new Set(allCats.filter((c) => c.active).map((c) => c.id));
  const cats = new Map(allCats.map((c) => [c.id, c.name]));
  const ids = [...new Set(input.items.map((i) => i.productId))];
  const productRows = await q("SELECT * FROM products WHERE id IN (SELECT jsonb_array_elements_text($1::text::jsonb)::int)", [JSON.stringify(ids)]);
  const byId = new Map(productRows.map((r) => [Number(r.id), rowToProduct(r)]));

  const lines = input.items.map((it) => {
    const p = byId.get(it.productId);
    if (!p) throw new OrderError("Um dos produtos não está mais disponível.");
    if (opts.enforceStore && (!p.active || !activeCats.has(p.categoryId))) {
      throw new OrderError(`"${p.name}" não está disponível no momento.`);
    }
    const size = p.sizes.find((s) => s.name === it.size) ?? (p.sizes.length === 1 ? p.sizes[0] : undefined);
    if (!size) throw new OrderError(`Escolha um tamanho válido para "${p.name}".`);
    const addons: Addon[] = [];
    for (const name of new Set(it.addons)) {
      const a = p.addons.find((x) => x.name === name);
      if (!a) throw new OrderError(`Adicional inválido em "${p.name}".`);
      addons.push(a);
    }
    const unit = size.price + addons.reduce((s, a) => s + a.price, 0);
    const total = unit * it.qty;
    const costPct = p.costPercent ?? settings.defaultCostPercent;
    return {
      p,
      category: cats.get(p.categoryId) ?? "",
      size: size.name,
      qty: it.qty,
      unit,
      addons,
      notes: it.notes,
      total,
      cost: Math.round((total * costPct) / 100),
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  if (opts.enforceStore && settings.minOrder > 0 && subtotal < settings.minOrder) {
    throw new OrderError("O pedido não atingiu o valor mínimo.");
  }
  const deliveryFee = input.deliveryType === "delivery" ? (opts.deliveryFeeOverride ?? settings.deliveryFee) : 0;
  const total = subtotal + deliveryFee;

  let changeFor: number | null = null;
  if (input.changeFor && (payment?.allowChange ?? /dinheiro/i.test(input.payment))) {
    if (input.changeFor < total) throw new OrderError("O valor do troco deve ser maior que o total do pedido.");
    changeFor = input.changeFor;
  }

  const address = input.deliveryType === "delivery" ? { ...input.address, city: input.address.city || settings.city } : EMPTY_ADDRESS;
  const cost = lines.reduce((s, l) => s + l.cost, 0);
  const phone = input.phone ? formatPhone(input.phone) : "";

  const id = await tx(async (d) => {
    const [o] = await d.query<{ id: number }>(
      `INSERT INTO orders (number, customer_name, phone, delivery_type, address, payment, change_for, subtotal, delivery_fee, total, cost, status, origin, notes)
       VALUES (nextval('order_number_seq'), $1, $2, $3, $4::text::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [
        input.customerName,
        phone,
        input.deliveryType,
        JSON.stringify(address),
        payment?.name ?? input.payment,
        changeFor,
        subtotal,
        deliveryFee,
        total,
        cost,
        opts.status,
        opts.origin,
        input.notes,
      ]
    );
    await d.query(
      `INSERT INTO order_items (order_id, product_id, name, category, size, qty, unit_price, addons, ingredients, notes, total, cost)
       SELECT $1, product_id, name, category, size, qty, unit_price, addons, ingredients, notes, total, cost
       FROM jsonb_to_recordset($2::text::jsonb) AS x(product_id int, name text, category text, size text, qty int, unit_price int,
         addons jsonb, ingredients jsonb, notes text, total int, cost int)`,
      [
        o.id,
        JSON.stringify(
          lines.map((l) => ({
            product_id: l.p.id,
            name: l.p.name,
            category: l.category,
            size: l.size,
            qty: l.qty,
            unit_price: l.unit,
            addons: l.addons,
            ingredients: l.p.ingredients,
            notes: l.notes,
            total: l.total,
            cost: l.cost,
          }))
        ),
      ]
    );
    return o.id;
  });
  return (await getOrder(id))!;
}

export async function clearDemoOrders(): Promise<number> {
  const rows = await q("DELETE FROM orders WHERE is_demo RETURNING id");
  return rows.length;
}

export async function countDemoOrders(): Promise<number> {
  const [{ n }] = await q<{ n: number }>("SELECT COUNT(*)::int AS n FROM orders WHERE is_demo");
  return n;
}

export async function countPending(): Promise<number> {
  const [{ n }] = await q<{ n: number }>("SELECT COUNT(*)::int AS n FROM orders WHERE status = 'pending'");
  return n;
}
