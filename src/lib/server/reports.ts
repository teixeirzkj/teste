import "server-only";
import { listOrders } from "./orders";
import { addDays, dayKey, dayStartISO, daysBetween, localHour } from "../time";
import { ORIGIN_LABEL, type Order } from "../types";

export type Report = Awaited<ReturnType<typeof buildReport>>;

function summarize(orders: Order[]) {
  const done = orders.filter((o) => o.status === "done");
  const revenue = done.reduce((s, o) => s + o.total, 0);
  const subtotal = done.reduce((s, o) => s + o.subtotal, 0);
  const cost = done.reduce((s, o) => s + o.cost, 0);
  const deliveryFees = done.reduce((s, o) => s + o.deliveryFee, 0);
  const itemsSold = done.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
  return {
    revenue,
    profit: subtotal - cost,
    orders: done.length,
    itemsSold,
    avgTicket: done.length ? Math.round(revenue / done.length) : 0,
    deliveryFees,
    canceled: orders.filter((o) => o.status === "canceled").length,
    inProgress: orders.filter((o) => ["pending", "preparing", "delivering"].includes(o.status)).length,
  };
}

export async function buildReport(from: string, to: string) {
  const orders = await listOrders({ fromISO: dayStartISO(from), toISO: dayStartISO(addDays(to, 1)) });
  const done = orders.filter((o) => o.status === "done");

  // Período anterior de mesmo tamanho, para comparação.
  const len = daysBetween(from, to).length;
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(len - 1));
  const prev = summarize(await listOrders({ fromISO: dayStartISO(prevFrom), toISO: dayStartISO(from) }));

  const days = new Map(daysBetween(from, to).map((d) => [d, { day: d, revenue: 0, orders: 0, profit: 0 }]));
  const products = new Map<string, { name: string; qty: number; revenue: number }>();
  const categories = new Map<string, { name: string; qty: number; revenue: number }>();
  const payments = new Map<string, { name: string; count: number; revenue: number }>();
  const origins = new Map<string, { name: string; count: number; revenue: number }>();
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0, revenue: 0 }));

  for (const o of done) {
    const d = days.get(dayKey(o.createdAt));
    if (d) {
      d.revenue += o.total;
      d.orders += 1;
      d.profit += o.subtotal - o.cost;
    }
    const h = hours[localHour(o.createdAt)];
    h.orders += 1;
    h.revenue += o.total;
    const pay = payments.get(o.payment) ?? { name: o.payment, count: 0, revenue: 0 };
    pay.count += 1;
    pay.revenue += o.total;
    payments.set(o.payment, pay);
    const oname = ORIGIN_LABEL[o.origin] ?? o.origin;
    const org = origins.get(oname) ?? { name: oname, count: 0, revenue: 0 };
    org.count += 1;
    org.revenue += o.total;
    origins.set(oname, org);
    for (const it of o.items) {
      const parts = it.flavors?.length ? it.flavors.map((f) => f.name) : [it.name];
      for (const name of parts) {
        const p = products.get(name) ?? { name, qty: 0, revenue: 0 };
        p.qty += it.qty / parts.length;
        p.revenue += Math.round(it.total / parts.length);
        products.set(name, p);
      }
      const cname = it.category || "Sem categoria";
      const c = categories.get(cname) ?? { name: cname, qty: 0, revenue: 0 };
      c.qty += it.qty;
      c.revenue += it.total;
      categories.set(cname, c);
    }
  }

  const byRevenue = <T extends { revenue: number }>(a: T, b: T) => b.revenue - a.revenue;
  return {
    range: { from, to, prevFrom, prevTo },
    totals: summarize(orders),
    previous: prev,
    byDay: [...days.values()],
    topProducts: [...products.values()].map((p) => ({ ...p, qty: Math.round(p.qty * 10) / 10 })).sort((a, b) => b.qty - a.qty || b.revenue - a.revenue),
    categories: [...categories.values()].sort(byRevenue),
    payments: [...payments.values()].sort(byRevenue),
    origins: [...origins.values()].sort(byRevenue),
    hours,
  };
}
