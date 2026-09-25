"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/format";
import { formatDayKey } from "@/lib/time";

// Série única em dourado escuro (validado: contraste >= 3:1 na superfície branca).
const SERIES = "#b8850f";
const GRID = "#efeae0";
const AXIS = "#7a7a80";

type Point = { label: string; value: number; extra?: string };

function ChartTooltip({ active, payload, fmt }: { active?: boolean; payload?: { payload: Point }[]; fmt: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-cream-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-ink-950">{p.label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-ink-700">
        <span className="h-2 w-2 rounded-sm" style={{ background: SERIES }} />
        {fmt(p.value)}
      </p>
      {p.extra && <p className="text-ink-500">{p.extra}</p>}
    </div>
  );
}

const compactMoney = (cents: number) => {
  const v = cents / 100;
  return v >= 1000 ? `R$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `R$${Math.round(v)}`;
};

/** Barras verticais com tooltip e alternância para tabela. */
export function BarsChart({
  data,
  fmt = money,
  axisFmt = compactMoney,
  height = 280,
  valueLabel = "Valor",
}: {
  data: Point[];
  fmt?: (v: number) => string;
  axisFmt?: (v: number) => string;
  height?: number;
  valueLabel?: string;
}) {
  const [table, setTable] = useState(false);
  const many = data.length > 16;
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button onClick={() => setTable((t) => !t)} className="rounded-lg px-2 py-1 text-xs font-bold text-ink-500 hover:bg-cream-100 hover:text-ink-950">
          {table ? "Ver gráfico" : "Ver tabela"}
        </button>
      </div>
      {table ? (
        <div className="max-h-[320px] overflow-auto rounded-xl border border-cream-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-cream-50 text-left text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-3 py-2">Período</th>
                <th className="px-3 py-2 text-right">{valueLabel}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label} className="border-t border-cream-100">
                  <td className="px-3 py-2">{d.label}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {fmt(d.value)}
                    {d.extra && <span className="ml-2 text-xs font-normal text-ink-500">{d.extra}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height }} role="img" aria-label={`Gráfico de barras: ${valueLabel}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap={many ? 2 : "18%"}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fontSize: 11, fill: AXIS }} interval="preserveStartEnd" minTickGap={14} />
              <YAxis tickFormatter={axisFmt} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: AXIS }} width={56} />
              <Tooltip cursor={{ fill: "rgba(184,133,15,.08)" }} content={<ChartTooltip fmt={fmt} />} />
              <Bar dataKey="value" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/** Ranking em barras horizontais (HTML): rótulos e valores sempre visíveis. */
export function RankBars({ rows, fmt = money, sub }: { rows: { name: string; value: number; sub?: string }[]; fmt?: (v: number) => string; sub?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="py-6 text-center text-sm text-ink-500">Sem dados no período.</p>;
  return (
    <ul className="space-y-3" aria-label={sub}>
      {rows.map((r, i) => (
        <li key={r.name} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-semibold text-ink-900">
              <span className="w-5 shrink-0 text-xs font-black text-ink-500 tabular-nums">{i + 1}</span>
              <span className="truncate">{r.name}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums text-ink-950">
              {fmt(r.value)}
              {r.sub && <span className="ml-1.5 text-xs font-medium text-ink-500">{r.sub}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-cream-100">
            <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${(r.value / max) * 100}%`, background: SERIES }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function dayPoints(byDay: { day: string; revenue: number; orders: number }[]): Point[] {
  return byDay.map((d) => ({ label: formatDayKey(d.day), value: d.revenue, extra: `${d.orders} pedido${d.orders === 1 ? "" : "s"}` }));
}
