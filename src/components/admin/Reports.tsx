"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarsChart, RankBars } from "./charts";
import { Card, Empty, PageHeader, PeriodPicker, Skeleton, Stat, pct, useFetch } from "./ui";
import { money } from "@/lib/format";
import { formatDayKey, resolvePeriod, type PeriodPreset } from "@/lib/time";
import type { Report } from "@/lib/server/reports";

type Gran = "day" | "week" | "month";
const GRAN_LABEL: Record<Gran, string> = { day: "Dia", week: "Semana", month: "Mês" };
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function weekStart(key: string) {
  const d = new Date(`${key}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // segunda = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

function group(byDay: Report["byDay"], g: Gran) {
  if (g === "day") return byDay.map((d) => ({ label: formatDayKey(d.day), value: d.revenue, orders: d.orders }));
  const m = new Map<string, { label: string; value: number; orders: number }>();
  for (const d of byDay) {
    const k = g === "week" ? weekStart(d.day) : d.day.slice(0, 7);
    const label = g === "week" ? `Sem. ${formatDayKey(k)}` : `${MONTHS[Number(k.slice(5, 7)) - 1]}/${k.slice(2, 4)}`;
    const cur = m.get(k) ?? { label, value: 0, orders: 0 };
    cur.value += d.revenue;
    cur.orders += d.orders;
    m.set(k, cur);
  }
  return [...m.values()];
}

export function Reports() {
  const [period, setPeriod] = useState<{ preset: PeriodPreset; from: string; to: string }>(() => ({ preset: "30d", ...resolvePeriod("30d") }));
  const [gran, setGran] = useState<Gran>("day");
  const qs = new URLSearchParams({ preset: period.preset, from: period.from, to: period.to }).toString();
  const { data: r, loading } = useFetch<Report>(`/api/admin/reports?${qs}`);

  const revenue = useMemo(() => (r ? group(r.byDay, gran).map((x) => ({ label: x.label, value: x.value, extra: `${x.orders} pedidos` })) : []), [r, gran]);
  const orders = useMemo(() => (r ? group(r.byDay, gran).map((x) => ({ label: x.label, value: x.orders })) : []), [r, gran]);
  const hours = useMemo(() => {
    if (!r) return [];
    const used = r.hours.filter((h) => h.orders > 0).map((h) => h.hour);
    if (!used.length) return [];
    // Mostra a faixa de horários com movimento (a noite pode passar da meia-noite).
    const order = Array.from({ length: 24 }, (_, i) => (i + 6) % 24);
    const first = order.findIndex((h) => used.includes(h));
    const last = order.length - 1 - [...order].reverse().findIndex((h) => used.includes(h));
    return order.slice(first, last + 1).map((h) => ({ label: `${String(h).padStart(2, "0")}h`, value: r.hours[h].orders, extra: money(r.hours[h].revenue) }));
  }, [r]);

  const t = r?.totals;
  const p = r?.previous;

  return (
    <>
      <PageHeader title="Relatórios" subtitle="Considera apenas pedidos finalizados. Comparação com o período anterior de mesmo tamanho." actions={<PeriodPicker {...period} onChange={setPeriod} />} />

      {loading && !r ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : r && t && p ? (
        <div className={`space-y-5 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
            <Stat accent label="Faturamento" value={money(t.revenue)} delta={pct(t.revenue, p.revenue)} />
            <Stat label="Lucro estimado" value={money(t.profit)} delta={pct(t.profit, p.profit)} />
            <Stat label="Pedidos" value={String(t.orders)} delta={pct(t.orders, p.orders)} />
            <Stat label="Ticket médio" value={money(t.avgTicket)} delta={pct(t.avgTicket, p.avgTicket)} />
            <Stat label="Taxas de entrega" value={money(t.deliveryFees)} delta={pct(t.deliveryFees, p.deliveryFees)} />
            <Stat label="Cancelados" value={String(t.canceled)} sub={`${t.inProgress} em andamento`} />
          </div>

          {!t.orders ? (
            <Empty>Nenhuma venda finalizada neste período.</Empty>
          ) : (
            <>
              <Card
                title="Faturamento"
                action={
                  <div className="flex rounded-xl bg-cream-100 p-1" role="radiogroup" aria-label="Agrupar por">
                    {(Object.keys(GRAN_LABEL) as Gran[]).map((g) => (
                      <button key={g} role="radio" aria-checked={gran === g} onClick={() => setGran(g)} className={`relative rounded-lg px-3 py-1 text-xs font-bold ${gran === g ? "text-ink-950" : "text-ink-500"}`}>
                        {gran === g && <motion.span layoutId="gran" className="absolute inset-0 rounded-lg bg-white shadow-sm" />}
                        <span className="relative">{GRAN_LABEL[g]}</span>
                      </button>
                    ))}
                  </div>
                }
              >
                <p className="-mt-2 mb-2 text-xs text-ink-500">
                  Por {GRAN_LABEL[gran].toLowerCase()} · {formatDayKey(r.range.from)} a {formatDayKey(r.range.to)}
                </p>
                <BarsChart data={revenue} valueLabel="Faturamento" />
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card title="Quantidade de pedidos">
                  <BarsChart data={orders} fmt={(v) => `${v} pedidos`} axisFmt={(v) => String(v)} height={240} valueLabel="Pedidos" />
                </Card>
                <Card title="Horários com mais pedidos">
                  <BarsChart data={hours} fmt={(v) => `${v} pedidos`} axisFmt={(v) => String(v)} height={240} valueLabel="Pedidos" />
                </Card>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <Card title="Produtos mais vendidos">
                  <RankBars sub="Produtos mais vendidos" fmt={(v) => `${v} un.`} rows={r.topProducts.slice(0, 10).map((x) => ({ name: x.name, value: x.qty, sub: money(x.revenue) }))} />
                </Card>
                <Card title="Categorias mais vendidas">
                  <RankBars sub="Categorias" rows={r.categories.map((x) => ({ name: x.name, value: x.revenue, sub: `${x.qty} un.` }))} />
                </Card>
                <div className="space-y-5">
                  <Card title="Formas de pagamento">
                    <RankBars sub="Formas de pagamento" rows={r.payments.map((x) => ({ name: x.name, value: x.revenue, sub: `${x.count}×` }))} />
                  </Card>
                  <Card title="Origem dos pedidos">
                    <RankBars sub="Origem" rows={r.origins.map((x) => ({ name: x.name, value: x.revenue, sub: `${x.count}×` }))} />
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
