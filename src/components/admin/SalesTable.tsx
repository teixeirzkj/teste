"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Download, Search } from "lucide-react";
import { Button, Card, Empty, Modal, PageHeader, PeriodPicker, Skeleton, inputCls, useFetch } from "./ui";
import { money } from "@/lib/format";
import { formatDateTime, formatDayKey, formatTime, dayKey, resolvePeriod, type PeriodPreset } from "@/lib/time";
import { ORIGIN_LABEL, STATUS_LABEL, type Order, type OrderStatus } from "@/lib/types";

type SortKey = "number" | "createdAt" | "customerName" | "total" | "payment" | "status" | "origin";

const STATUS_CLS: Record<OrderStatus, string> = {
  pending: "bg-orange-100 text-orange-800",
  preparing: "bg-amber-100 text-amber-800",
  delivering: "bg-sky-100 text-sky-800",
  done: "bg-emerald-100 text-emerald-800",
  canceled: "bg-red-100 text-red-700",
};

/** Evita injeção de fórmulas ao abrir o CSV no Excel. */
const csvSafe = (v: string) => (/^[=+\-@\t\r]/.test(v) && !/^-?\d/.test(v) ? `'${v}` : v);

export function SalesTable() {
  const [period, setPeriod] = useState<{ preset: PeriodPreset; from: string; to: string }>(() => ({ preset: "30d", ...resolvePeriod("30d") }));
  const qs = new URLSearchParams({ preset: period.preset, from: period.from, to: period.to }).toString();
  const { data, loading } = useFetch<{ orders: Order[] }>(`/api/admin/orders?${qs}`);
  const [q, setQ] = useState("");
  const [pay, setPay] = useState("all");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [origin, setOrigin] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "createdAt", dir: -1 });
  const [detail, setDetail] = useState<Order | null>(null);

  const orders = useMemo(() => data?.orders ?? [], [data]);
  const payments = [...new Set(orders.map((o) => o.payment))].sort();

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orders
      .filter(
        (o) =>
          (pay === "all" || o.payment === pay) &&
          (status === "all" || o.status === status) &&
          (origin === "all" || o.origin === origin) &&
          (!t || String(o.number).includes(t) || o.customerName.toLowerCase().includes(t) || o.phone.includes(t))
      )
      .sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        return (typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "pt-BR")) * sort.dir;
      });
  }, [orders, q, pay, status, origin, sort]);

  const done = rows.filter((o) => o.status === "done");
  const sum = done.reduce((s, o) => s + o.total, 0);

  const th = (key: SortKey, label: string, right = false) => (
    <th aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={`px-3 py-3 ${right ? "text-right" : ""}`}>
      <button onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "createdAt" || key === "total" ? -1 : 1 }))} className={`inline-flex items-center gap-1 hover:text-ink-950 ${sort.key === key ? "text-ink-950" : ""}`}>
        {label}
        <ArrowDownUp className={`h-3 w-3 ${sort.key === key ? "opacity-100" : "opacity-30"}`} />
      </button>
    </th>
  );

  const exportCsv = () => {
    const head = ["Número", "Data", "Horário", "Cliente", "Telefone", "Valor", "Pagamento", "Status", "Origem", "Entrega"];
    const lines = rows.map((o) => [o.number, formatDayKey(dayKey(o.createdAt), { day: "2-digit", month: "2-digit", year: "numeric" }), formatTime(o.createdAt), o.customerName, o.phone, (o.total / 100).toFixed(2).replace(".", ","), o.payment, STATUS_LABEL[o.status], ORIGIN_LABEL[o.origin], o.deliveryType === "delivery" ? "Entrega" : o.deliveryType === "table" ? `Mesa ${o.tableNumber}` : "Retirada"]);
    const csv = [head, ...lines].map((r) => r.map((c) => `"${csvSafe(String(c)).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas-${period.from}-a-${period.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const select = "h-10 rounded-xl border border-cream-200 bg-white px-3 text-sm font-semibold text-ink-800 outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-400/20";

  return (
    <>
      <PageHeader
        title="Vendas"
        subtitle="Todos os pedidos registrados — site, balcão, telefone e WhatsApp."
        actions={
          <Button variant="ghost" onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        }
      />

      <div className="mb-4 space-y-3">
        <PeriodPicker {...period} onChange={setPeriod} />
        <div className="flex flex-wrap gap-2">
          <label className="relative block w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nº, cliente ou telefone" className={`${inputCls} h-10 py-1.5 pl-9 text-sm`} aria-label="Pesquisar vendas" />
          </label>
          <select className={select} value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Filtrar por pagamento">
            <option value="all">Todos os pagamentos</option>
            {payments.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select className={select} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "all")} aria-label="Filtrar por status">
            <option value="all">Todos os status</option>
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <select className={select} value={origin} onChange={(e) => setOrigin(e.target.value)} aria-label="Filtrar por origem">
            <option value="all">Todas as origens</option>
            {Object.entries(ORIGIN_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-100 px-5 py-3.5 text-sm">
          <span className="text-ink-600">
            <b className="text-ink-950">{rows.length}</b> pedido(s) · <b className="text-ink-950">{done.length}</b> finalizado(s)
          </span>
          <span className="font-bold">
            Faturado: <span className="tabular-nums">{money(sum)}</span>
          </span>
        </div>
        {loading && !data ? (
          <div className="p-5">
            <Skeleton className="h-64" />
          </div>
        ) : !rows.length ? (
          <div className="p-5">
            <Empty>Nenhuma venda com esses filtros.</Empty>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-cream-50 text-left text-[11px] font-bold uppercase tracking-wider text-ink-500">
                <tr>
                  {th("number", "Nº")}
                  {th("createdAt", "Data / horário")}
                  {th("customerName", "Cliente")}
                  {th("total", "Valor", true)}
                  {th("payment", "Pagamento")}
                  {th("status", "Status")}
                  {th("origin", "Origem")}
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 500).map((o) => (
                  <tr key={o.id} className="border-t border-cream-100 transition hover:bg-cream-50">
                    <td className="px-3 py-3 font-black">#{o.number}</td>
                    <td className="px-3 py-3 tabular-nums text-ink-700">
                      {formatDayKey(dayKey(o.createdAt))} <span className="text-ink-500">{formatTime(o.createdAt)}</span>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3 font-semibold">{o.customerName}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">{money(o.total)}</td>
                    <td className="px-3 py-3 text-ink-700">{o.payment}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CLS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    </td>
                    <td className="px-3 py-3 text-ink-700">{ORIGIN_LABEL[o.origin]}</td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => setDetail(o)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink-700 hover:bg-cream-100">
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 500 && <p className="p-4 text-center text-xs text-ink-500">Mostrando 500 de {rows.length}. Use os filtros ou exporte o CSV.</p>}
          </div>
        )}
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Pedido #${detail.number}` : ""}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CLS[detail.status]}`}>{STATUS_LABEL[detail.status]}</span>
              <span className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-bold">{ORIGIN_LABEL[detail.origin]}</span>
              <span className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-bold">{formatDateTime(detail.createdAt)}</span>
            </div>
            <div>
              <p className="font-bold">{detail.customerName}</p>
              <p className="text-ink-600">{detail.phone}</p>
              {detail.deliveryType === "delivery" ? (
                <p className="text-ink-600">
                  {detail.address.street}, {detail.address.number} — {detail.address.district}
                  {detail.address.complement && ` · ${detail.address.complement}`}
                  {detail.address.reference && ` · Ref.: ${detail.address.reference}`}
                </p>
              ) : (
                <p className="text-ink-600">{detail.deliveryType === "table" ? `Mesa ${detail.tableNumber}` : "Retirada no local"}</p>
              )}
            </div>
            <ul className="divide-y divide-cream-100 rounded-xl border border-cream-200">
              {detail.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 p-3">
                  <span>
                    <b>
                      {i.qty}x {i.name}
                    </b>
                    {i.size !== "Único" && ` · ${i.size}`}
                    {i.addons.length > 0 && <span className="block text-xs text-gold-700">+ {i.addons.map((a) => a.name).join(", ")}</span>}
                    {i.notes && <span className="block text-xs italic text-ink-500">{i.notes}</span>}
                  </span>
                  <span className="font-bold tabular-nums">{money(i.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{money(detail.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Entrega</dt>
                <dd className="tabular-nums">{money(detail.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between text-base font-black">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(detail.total)}</dd>
              </div>
              <div className="flex justify-between text-ink-600">
                <dt>Pagamento</dt>
                <dd>
                  {detail.payment}
                  {detail.changeFor ? ` · troco p/ ${money(detail.changeFor)}` : ""}
                </dd>
              </div>
            </dl>
            {detail.notes && <p className="rounded-xl bg-gold-100 p-3">{detail.notes}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
