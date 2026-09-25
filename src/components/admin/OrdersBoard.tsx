"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bike, Check, ChevronDown, Clock, Copy, MapPin, MessageCircle, Phone, Search, Store, X } from "lucide-react";
import { Button, Empty, Modal, PageHeader, Skeleton, api, inputCls, useToast } from "./ui";
import { mapsLink, money, waLink } from "@/lib/format";
import { formatTime, timeAgo } from "@/lib/time";
import { ORIGIN_LABEL, STATUS_LABEL, type Order, type OrderStatus } from "@/lib/types";

const COLUMNS: { status: OrderStatus; title: string; dot: string; ring: string }[] = [
  { status: "pending", title: "Pendentes", dot: "bg-flame-500", ring: "ring-flame-500/30" },
  { status: "preparing", title: "Em preparo", dot: "bg-gold-500", ring: "ring-gold-500/30" },
  { status: "delivering", title: "Saiu para entrega", dot: "bg-sky-500", ring: "ring-sky-500/30" },
  { status: "done", title: "Finalizados", dot: "bg-emerald-500", ring: "ring-emerald-500/30" },
];

export function OrdersBoard() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<OrderStatus>("pending");
  const [addr, setAddr] = useState<Order | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const r = await api<{ orders: Order[] }>("/api/admin/orders?view=board");
      setOrders(r.orders);
      setNow(Date.now());
      window.dispatchEvent(new CustomEvent("psp:pending", { detail: r.orders.filter((o) => o.status === "pending").length }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao carregar pedidos", "error");
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, 10000);
    const on = () => load();
    window.addEventListener("psp:new-order", on);
    return () => {
      clearInterval(t);
      window.removeEventListener("psp:new-order", on);
    };
  }, [load]);

  const move = async (o: Order, status: OrderStatus) => {
    if (status === "canceled" && !confirm(`Cancelar o pedido nº ${o.number}? Ele sai do quadro e não entra no faturamento.`)) return;
    const prev = orders;
    setOrders((cur) => cur?.map((x) => (x.id === o.id ? { ...x, status, updatedAt: new Date().toISOString() } : x)) ?? null);
    try {
      await api(`/api/admin/orders/${o.id}`, { method: "PATCH", body: { status } });
      toast(`Pedido nº ${o.number}: ${STATUS_LABEL[status]}`);
      load();
    } catch (e) {
      setOrders(prev);
      toast(e instanceof Error ? e.message : "Erro", "error");
    }
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (orders ?? []).filter((o) => !t || String(o.number).includes(t) || o.customerName.toLowerCase().includes(t) || o.phone.includes(t));
  }, [orders, q]);
  const byStatus = (s: OrderStatus) => filtered.filter((o) => o.status === s).sort((a, b) => (s === "done" ? b.updatedAt.localeCompare(a.updatedAt) : a.createdAt.localeCompare(b.createdAt)));

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle="Atualiza sozinho a cada 10 segundos. Finalizados mostram as últimas 24 horas."
        actions={
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nº, nome ou telefone" className={`${inputCls} pl-9`} aria-label="Buscar pedidos" />
          </label>
        }
      />

      {/* Abas no celular */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
        {COLUMNS.map((c) => (
          <button
            key={c.status}
            onClick={() => setTab(c.status)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${tab === c.status ? "bg-ink-950 text-white" : "bg-white text-ink-700 ring-1 ring-cream-200"}`}
          >
            <span className={`h-2 w-2 rounded-full ${c.dot}`} />
            {c.title}
            <span className={`rounded-full px-1.5 text-xs ${tab === c.status ? "bg-white/15" : "bg-cream-100"}`}>{byStatus(c.status).length}</span>
          </button>
        ))}
      </div>

      {!orders ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUMNS.map((c) => (
            <Skeleton key={c.status} className="h-72" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUMNS.map((c) => {
            const list = byStatus(c.status);
            return (
              <section key={c.status} className={`min-w-0 rounded-3xl bg-cream-100/70 p-2.5 ${tab === c.status ? "" : "max-lg:hidden"}`} aria-label={c.title}>
                <header className="flex items-center justify-between px-2 py-2">
                  <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-ink-800">
                    <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                    {c.title}
                  </h2>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-ink-700">{list.length}</span>
                </header>
                <div className="space-y-2.5 lg:max-h-[calc(100dvh-230px)] lg:overflow-y-auto lg:pr-0.5">
                  <AnimatePresence initial={false}>
                    {list.map((o) => (
                      <OrderCard key={o.id} o={o} now={now} ring={c.ring} onMove={move} onAddress={() => setAddr(o)} />
                    ))}
                  </AnimatePresence>
                  {!list.length && <Empty>Nenhum pedido aqui.</Empty>}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <AddressModal order={addr} onClose={() => setAddr(null)} />
    </>
  );
}

function OrderCard({ o, now, ring, onMove, onAddress }: { o: Order; now: number; ring: string; onMove: (o: Order, s: OrderStatus) => void; onAddress: () => void }) {
  const [open, setOpen] = useState(false);
  const items = o.items.reduce((s, i) => s + i.qty, 0);
  const fresh = o.status === "pending" && now - Date.parse(o.createdAt) < 5 * 60000;
  const delivery = o.deliveryType === "delivery";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-cream-200 ${fresh ? `ring-2 ${ring}` : ""}`}
    >
      <button onClick={() => setOpen((v) => !v)} className="w-full p-3.5 text-left" aria-expanded={open}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold text-ink-500">
              <span className="font-black text-ink-950">#{o.number}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatTime(o.createdAt)} · {timeAgo(o.createdAt)}
              </span>
            </p>
            <p className="mt-1 truncate text-[15px] font-extrabold">{o.customerName}</p>
          </div>
          <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <span className="text-base font-black tabular-nums text-ink-950">{money(o.total)}</span>
          <span className="rounded-md bg-cream-100 px-1.5 py-0.5 text-ink-600">
            {items} {items === 1 ? "item" : "itens"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-cream-100 px-1.5 py-0.5 text-ink-600">
            {delivery ? <Bike className="h-3 w-3" /> : <Store className="h-3 w-3" />}
            {delivery ? "Entrega" : "Retirada"}
          </span>
          <span className="rounded-md bg-cream-100 px-1.5 py-0.5 text-ink-600">{ORIGIN_LABEL[o.origin]}</span>
          {fresh && <span className="rounded-md bg-flame-500 px-1.5 py-0.5 text-white">NOVO</span>}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="space-y-3 border-t border-cream-100 px-3.5 pb-3.5 pt-3 text-sm">
              <ul className="space-y-2">
                {o.items.map((it) => (
                  <li key={it.id} className="rounded-xl bg-cream-50 p-2.5">
                    <div className="flex justify-between gap-2 font-bold">
                      <span>
                        {it.qty}x {it.name}
                        {it.size && it.size !== "Único" && <span className="font-semibold text-ink-500"> · {it.size}</span>}
                      </span>
                      <span className="tabular-nums">{money(it.total)}</span>
                    </div>
                    {it.addons.length > 0 && <p className="mt-0.5 text-xs font-semibold text-gold-700">+ {it.addons.map((a) => a.name).join(", ")}</p>}
                    {it.notes && <p className="mt-0.5 text-xs italic text-ink-600">Obs.: {it.notes}</p>}
                  </li>
                ))}
              </ul>
              <dl className="space-y-1 text-xs">
                <Line k="Subtotal" v={money(o.subtotal)} />
                {delivery && <Line k="Taxa de entrega" v={money(o.deliveryFee)} />}
                <Line k="Total" v={money(o.total)} strong />
                <Line k="Pagamento" v={o.payment} />
                {o.changeFor ? <Line k="Troco para" v={`${money(o.changeFor)} (levar ${money(o.changeFor - o.total)})`} /> : null}
              </dl>
              {o.notes && <p className="rounded-xl bg-gold-100 p-2.5 text-xs font-semibold text-ink-800">📝 {o.notes}</p>}
              <div className="space-y-1.5 rounded-xl border border-cream-200 p-2.5 text-xs">
                <p className="font-bold text-ink-950">{o.customerName}</p>
                {o.phone && (
                  <div className="flex flex-wrap gap-3">
                    <a href={`tel:${o.phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-1 font-semibold text-ink-700 hover:underline">
                      <Phone className="h-3 w-3" /> {o.phone}
                    </a>
                    <a href={waLink(o.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </a>
                  </div>
                )}
                {delivery ? (
                  <>
                    <p className="text-ink-700">
                      {o.address.street}, {o.address.number} — {o.address.district}
                      {o.address.complement && ` · ${o.address.complement}`}
                    </p>
                    {o.address.reference && <p className="text-ink-500">Ref.: {o.address.reference}</p>}
                    <button onClick={onAddress} className="mt-1 inline-flex items-center gap-1 rounded-lg bg-ink-950 px-2.5 py-1.5 font-bold text-white hover:bg-ink-800">
                      <MapPin className="h-3.5 w-3.5" /> Ver endereço
                    </button>
                  </>
                ) : (
                  <p className="font-semibold text-ink-600">Cliente vai retirar no local.</p>
                )}
              </div>

              <div className="space-y-2 pt-1">
                {o.status === "pending" && (
                  <Button variant="flame" className="w-full whitespace-nowrap" onClick={() => onMove(o, "preparing")}>
                    <Check className="h-4 w-4" /> Aceitar pedido
                  </Button>
                )}
                {o.status === "preparing" &&
                  (delivery ? (
                    <Button variant="gold" className="w-full whitespace-nowrap" onClick={() => onMove(o, "delivering")}>
                      <Bike className="h-4 w-4" /> Saiu para entrega
                    </Button>
                  ) : (
                    <Button className="w-full whitespace-nowrap" onClick={() => onMove(o, "done")}>
                      <Check className="h-4 w-4" /> Retirado — finalizar
                    </Button>
                  ))}
                {o.status === "delivering" && (
                  <Button className="w-full whitespace-nowrap" onClick={() => onMove(o, "done")}>
                    <Check className="h-4 w-4" /> Finalizar pedido
                  </Button>
                )}
                {["pending", "preparing", "delivering"].includes(o.status) && (
                  <Button variant="danger" size="sm" className="w-full" onClick={() => onMove(o, "canceled")}>
                    <X className="h-3.5 w-3.5" /> Cancelar
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function Line({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-2 ${strong ? "text-sm font-black text-ink-950" : "text-ink-600"}`}>
      <dt>{k}</dt>
      <dd className="text-right tabular-nums">{v}</dd>
    </div>
  );
}

function AddressModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const toast = useToast();
  const a = order?.address;
  const full = a ? [`${a.street}, ${a.number}`, a.district, a.city].filter(Boolean).join(" — ") : "";
  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={order ? `Endereço · #${order.number}` : "Endereço"}
      footer={
        a && (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                navigator.clipboard?.writeText(`${full}${a.complement ? ` (${a.complement})` : ""}${a.reference ? ` Ref.: ${a.reference}` : ""}`);
                toast("Endereço copiado");
              }}
            >
              <Copy className="h-4 w-4" /> Copiar
            </Button>
            <a href={mapsLink([`${a.street}, ${a.number}`, a.district, a.city])} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-bold text-white hover:bg-ink-800">
              <MapPin className="h-4 w-4" /> Abrir no Google Maps
            </a>
          </>
        )
      }
    >
      {order && a && (
        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 text-[15px]">
          {[
            ["Cliente", order.customerName],
            ["Telefone", order.phone || "—"],
            ["Rua", a.street],
            ["Número", a.number],
            ["Bairro", a.district],
            ["Complemento", a.complement || "—"],
            ["Referência", a.reference || "—"],
            ["Cidade", a.city || "—"],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-xs font-bold uppercase tracking-wider text-ink-500">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </Modal>
  );
}

