"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, DollarSign, Package, Pizza, Receipt, TrendingUp } from "lucide-react";
import { BarsChart, RankBars, dayPoints } from "./charts";
import { Card, Empty, PageHeader, PeriodPicker, Skeleton, Stat, pct, useFetch } from "./ui";
import { money } from "@/lib/format";
import { PERIOD_LABEL, formatDayKey, resolvePeriod, type PeriodPreset } from "@/lib/time";
import type { Report } from "@/lib/server/reports";

export function Dashboard({ name }: { name: string }) {
  const [period, setPeriod] = useState<{ preset: PeriodPreset; from: string; to: string }>(() => ({ preset: "7d", ...resolvePeriod("7d") }));
  const qs = new URLSearchParams({ preset: period.preset, from: period.from, to: period.to }).toString();
  const { data: r, loading, error } = useFetch<Report>(`/api/admin/reports?${qs}`);

  // Saudação calculada no navegador (fuso do usuário), evitando divergência de hidratação.
  const [greet, setGreet] = useState("Olá");
  useEffect(() => {
    const h = new Date().getHours();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreet(h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite");
  }, []);

  return (
    <>
      <PageHeader
        title="Painel"
        subtitle={`${greet}, ${name.split(" ")[0]}! Resumo das vendas finalizadas.`}
        actions={<PeriodPicker {...period} onChange={setPeriod} />}
      />

      {error && <Empty>{error}</Empty>}

      {loading && !r ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : r ? (
        <div className={`space-y-5 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-1">
              <Stat accent label="Faturamento" value={money(r.totals.revenue)} delta={pct(r.totals.revenue, r.previous.revenue)} sub="vs. período anterior" icon={<DollarSign className="h-4 w-4" />} />
            </div>
            <Stat label="Lucro estimado" value={money(r.totals.profit)} delta={pct(r.totals.profit, r.previous.profit)} icon={<TrendingUp className="h-4 w-4" />} />
            <Stat label="Pedidos" value={String(r.totals.orders)} delta={pct(r.totals.orders, r.previous.orders)} icon={<Package className="h-4 w-4" />} />
            <Stat label="Produtos vendidos" value={String(r.totals.itemsSold)} delta={pct(r.totals.itemsSold, r.previous.itemsSold)} icon={<Pizza className="h-4 w-4" />} />
            <Stat label="Ticket médio" value={money(r.totals.avgTicket)} delta={pct(r.totals.avgTicket, r.previous.avgTicket)} icon={<Receipt className="h-4 w-4" />} />
          </div>

          {r.totals.inProgress > 0 && (
            <Link href="/admin/pedidos" className="flex items-center justify-between gap-3 rounded-2xl border border-gold-400/40 bg-gold-100 px-5 py-3.5 text-sm font-bold text-ink-900 transition hover:bg-gold-200">
              <span>
                {r.totals.inProgress} pedido{r.totals.inProgress > 1 ? "s" : ""} em andamento agora
              </span>
              <span className="inline-flex items-center gap-1">
                Abrir pedidos <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          )}

          <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <Card title="Vendas por dia">
              <p className="-mt-2 mb-2 text-xs text-ink-500">
                Faturamento diário · {PERIOD_LABEL[period.preset]} ({formatDayKey(r.range.from)} a {formatDayKey(r.range.to)})
              </p>
              {r.totals.orders ? <BarsChart data={dayPoints(r.byDay)} valueLabel="Faturamento" /> : <Empty>Nenhuma venda finalizada no período.</Empty>}
            </Card>
            <Card title="Produtos mais vendidos">
              <RankBars
                sub="Produtos mais vendidos"
                fmt={(v) => `${v} un.`}
                rows={r.topProducts.slice(0, 8).map((p) => ({ name: p.name, value: p.qty, sub: money(p.revenue) }))}
              />
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
