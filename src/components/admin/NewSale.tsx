"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, Search, Trash2 } from "lucide-react";
import { Button, Card, Empty, Field, Modal, PageHeader, Skeleton, api, inputCls, useFetch, useToast } from "./ui";
import { centsToInput, flavorLabel, flavorPrice, formatPhone, minPrice, money, parseMoney } from "@/lib/format";
import type { Addon, Category, DeliveryType, Order, OrderOrigin, OrderStatus, Product, Settings } from "@/lib/types";

type Line = { key: string; product: Product; flavors: Product[]; size: string; addons: Addon[]; notes: string; qty: number; unit: number };

const ORIGINS: { v: OrderOrigin; l: string }[] = [
  { v: "balcao", l: "Balcão" },
  { v: "telefone", l: "Telefone" },
  { v: "whatsapp", l: "WhatsApp" },
];
const STATUSES: { v: OrderStatus; l: string }[] = [
  { v: "pending", l: "Pendente" },
  { v: "preparing", l: "Em preparo" },
  { v: "done", l: "Já finalizada" },
];

export function NewSale() {
  const toast = useToast();
  const menu = useFetch<{ products: Product[]; categories: Category[] }>("/api/admin/products");
  const conf = useFetch<{ settings: Settings }>("/api/admin/settings");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<number | "all">("all");
  const [picking, setPicking] = useState<Product | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [origin, setOrigin] = useState<OrderOrigin>("balcao");
  const [delivery, setDelivery] = useState<DeliveryType>("pickup");
  const [addr, setAddr] = useState({ street: "", number: "", district: "", complement: "", reference: "", city: "" });
  const [fee, setFee] = useState<string | null>(null);
  const [payment, setPayment] = useState("");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<OrderStatus>("preparing");
  const [saving, setSaving] = useState(false);
  const [last, setLast] = useState<Order | null>(null);

  const settings = conf.data?.settings;
  const products = useMemo(() => {
    const t = q.trim().toLowerCase();
    const catOrder = new Map(menu.data?.categories.filter((c) => c.active).map((c) => [c.id, c.sort]));
    const activeCats = new Set(catOrder.keys());
    return (menu.data?.products ?? []).slice().sort((a, b) => (catOrder.get(a.categoryId) ?? 0) - (catOrder.get(b.categoryId) ?? 0) || a.sort - b.sort).filter((p) => p.active && activeCats.has(p.categoryId) && (cat === "all" || p.categoryId === cat) && (!t || p.name.toLowerCase().includes(t)));
  }, [menu.data, q, cat]);

  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const feeCents = delivery === "delivery" ? (fee === null ? (settings?.deliveryFee ?? 0) : parseMoney(fee)) : 0;
  const total = subtotal + feeCents;
  const payObj = settings?.payments.find((p) => p.name === payment);

  const add = (l: Omit<Line, "key">) => setLines((c) => [...c, { ...l, key: Math.random().toString(36).slice(2) }]);

  const quick = (p: Product) => {
    if (p.sizes.length === 1 && !p.addons.length) add({ product: p, flavors: [], size: p.sizes[0].name, addons: [], notes: "", qty: 1, unit: p.sizes[0].price });
    else setPicking(p);
  };

  const reset = () => {
    setLines([]);
    setCustomer({ name: "", phone: "" });
    setAddr({ street: "", number: "", district: "", complement: "", reference: "", city: "" });
    setFee(null);
    setPayment("");
    setChangeFor("");
    setNotes("");
  };

  const submit = async () => {
    if (!lines.length) return toast("Adicione ao menos um produto.", "error");
    if (!payment) return toast("Escolha a forma de pagamento.", "error");
    setSaving(true);
    try {
      const r = await api<{ order: Order }>("/api/admin/orders", {
        body: {
          customerName: customer.name.trim() || "Cliente balcão",
          phone: customer.phone,
          deliveryType: delivery,
          address: delivery === "delivery" ? addr : undefined,
          payment,
          changeFor: payObj?.allowChange && changeFor ? parseMoney(changeFor) : null,
          notes,
          origin,
          status,
          deliveryFee: delivery === "delivery" ? feeCents : null,
          items: lines.map((l) => ({
            productId: l.product.id,
            size: l.size,
            qty: l.qty,
            addons: l.addons.map((a) => a.name),
            flavors: l.flavors.map((x) => x.id),
            notes: l.notes,
          })),
        },
      });
      setLast(r.order);
      toast(`Venda nº ${r.order.number} registrada`);
      reset();
      window.dispatchEvent(new Event("psp:new-order"));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao registrar", "error");
    } finally {
      setSaving(false);
    }
  };

  const label = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-600";

  return (
    <>
      <PageHeader title="Nova venda" subtitle="Registre pedidos feitos no balcão, por telefone ou WhatsApp. Entram direto em Pedidos, Vendas e Relatórios." />

      <AnimatePresence>
        {last && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-800">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Venda nº {last.number} registrada · {money(last.total)}
            </span>
            <span className="flex gap-2">
              <Link href="/admin/pedidos" className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white">
                Ver em Pedidos
              </Link>
              <button onClick={() => setLast(null)} className="rounded-lg px-2 py-1.5 text-xs font-bold hover:bg-emerald-100">
                Fechar
              </button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative block sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto" className={`${inputCls} pl-9`} aria-label="Buscar produto" />
            </label>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {[{ id: "all" as const, name: "Todos" }, ...(menu.data?.categories.filter((c) => c.active) ?? [])].map((c) => (
                <button key={c.id} onClick={() => setCat(c.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${cat === c.id ? "bg-ink-950 text-white" : "bg-cream-100 text-ink-600"}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          {!menu.data ? (
            <Skeleton className="h-80" />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => quick(p)}
                  className="group overflow-hidden rounded-2xl border border-cream-200 bg-white text-left transition hover:border-gold-500 hover:shadow-md"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-cream-100">
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-sm font-extrabold">{p.name}</p>
                    <p className="text-xs font-bold text-gold-700">
                      {p.sizes.length > 1 && "a partir de "}
                      {money(minPrice(p.sizes))}
                    </p>
                  </div>
                </motion.button>
              ))}
              {!products.length && <Empty>Nenhum produto.</Empty>}
            </div>
          )}
        </Card>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <Card title="Comanda">
            {!lines.length ? (
              <Empty>Toque nos produtos para adicionar.</Empty>
            ) : (
              <ul className="mb-4 space-y-2">
                {lines.map((l) => (
                  <li key={l.key} className="rounded-xl bg-cream-50 p-2.5 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold">
                        {l.flavors.length ? flavorLabel([l.product.name, ...l.flavors.map((x) => x.name)]) : l.product.name}
                        {l.size !== "Único" && <span className="font-semibold text-ink-500"> · {l.size}</span>}
                      </p>
                      <button onClick={() => setLines((c) => c.filter((x) => x.key !== l.key))} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-red-600 hover:bg-red-50" aria-label="Remover">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {l.addons.length > 0 && <p className="text-xs text-gold-700">+ {l.addons.map((a) => a.name).join(", ")}</p>}
                    {l.notes && <p className="text-xs italic text-ink-500">{l.notes}</p>}
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-cream-200 bg-white">
                        <button onClick={() => setLines((c) => c.map((x) => (x.key === l.key ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))} className="grid h-8 w-8 place-items-center" aria-label="Diminuir">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center font-black tabular-nums">{l.qty}</span>
                        <button onClick={() => setLines((c) => c.map((x) => (x.key === l.key ? { ...x, qty: Math.min(50, x.qty + 1) } : x)))} className="grid h-8 w-8 place-items-center" aria-label="Aumentar">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-black tabular-nums">{money(l.unit * l.qty)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-3 border-t border-cream-100 pt-4">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Cliente">
                  <input className={inputCls} value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} placeholder="Nome" />
                </Field>
                <Field label="Telefone">
                  <input className={inputCls} inputMode="tel" value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: formatPhone(e.target.value) }))} placeholder="(74) 9…" />
                </Field>
              </div>
              <Segment label="Origem" value={origin} onChange={setOrigin} options={ORIGINS} />
              <Segment
                label="Entrega"
                value={delivery}
                onChange={setDelivery}
                options={[
                  { v: "pickup", l: "Retirada / balcão" },
                  { v: "delivery", l: "Entrega" },
                ]}
              />
              <AnimatePresence initial={false}>
                {delivery === "delivery" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden">
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <input className={inputCls} placeholder="Rua" value={addr.street} onChange={(e) => setAddr((a) => ({ ...a, street: e.target.value }))} aria-label="Rua" />
                      <input className={inputCls} placeholder="Nº" value={addr.number} onChange={(e) => setAddr((a) => ({ ...a, number: e.target.value }))} aria-label="Número" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className={inputCls} placeholder="Bairro" value={addr.district} onChange={(e) => setAddr((a) => ({ ...a, district: e.target.value }))} aria-label="Bairro" />
                      <input className={inputCls} placeholder="Complemento" value={addr.complement} onChange={(e) => setAddr((a) => ({ ...a, complement: e.target.value }))} aria-label="Complemento" />
                    </div>
                    <input className={inputCls} placeholder="Referência" value={addr.reference} onChange={(e) => setAddr((a) => ({ ...a, reference: e.target.value }))} aria-label="Referência" />
                    <Field label="Taxa de entrega (R$)">
                      <input className={inputCls} inputMode="decimal" value={fee ?? centsToInput(settings?.deliveryFee ?? 0)} onChange={(e) => setFee(e.target.value)} />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <span className={label}>Pagamento</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {settings?.payments.map((p) => (
                    <button key={p.id} onClick={() => setPayment(p.name)} className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${payment === p.name ? "border-ink-950 bg-ink-950 text-white" : "border-cream-200 bg-white text-ink-700"}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              {payObj?.allowChange && (
                <Field label="Troco para (R$)" hint="Deixe em branco se não precisar.">
                  <input className={inputCls} inputMode="decimal" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} placeholder="Ex.: 100,00" />
                </Field>
              )}
              <Field label="Observações">
                <textarea className={`${inputCls} resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              <Segment label="Status inicial" value={status} onChange={setStatus} options={STATUSES} />

              <div className="space-y-1 rounded-2xl bg-cream-50 p-3.5 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{money(subtotal)}</span>
                </div>
                {delivery === "delivery" && (
                  <div className="flex justify-between text-ink-600">
                    <span>Entrega</span>
                    <span className="tabular-nums">{money(feeCents)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-lg font-black">
                  <span>Total</span>
                  <span className="tabular-nums">{money(total)}</span>
                </div>
              </div>
              <Button variant="flame" className="h-12 w-full text-base" onClick={submit} disabled={saving || !lines.length}>
                {saving ? "Registrando…" : "Registrar venda"}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {picking && (
        <Picker
          product={picking}
          all={menu.data?.products ?? []}
          onClose={() => setPicking(null)}
          onAdd={(l) => {
            add(l);
            setPicking(null);
          }}
        />
      )}
    </>
  );
}

function Segment<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-600">{label}</span>
      <div className="flex gap-1 rounded-xl bg-cream-100 p-1" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.v} role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition ${value === o.v ? "bg-white text-ink-950 shadow-sm" : "text-ink-600"}`}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Picker({ product: p, all, onClose, onAdd }: { product: Product; all: Product[]; onClose: () => void; onAdd: (l: Omit<Line, "key">) => void }) {
  const [size, setSize] = useState(p.sizes.find((s) => s.name === "Grande")?.name ?? p.sizes[0].name);
  const [addons, setAddons] = useState<string[]>([]);
  const [extra, setExtra] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState(1);
  const s = p.sizes.find((x) => x.name === size) ?? p.sizes[0];
  const maxFlavors = s.flavors ?? 1;
  const priceAt = (x: Product) => x.sizes.find((z) => z.name === s.name)?.price;
  const candidates = all.filter((x) => x.active && x.categoryId === p.categoryId && x.id !== p.id && priceAt(x) != null);
  const extraProducts = extra.map((id) => all.find((x) => x.id === id)).filter((x): x is Product => !!x && priceAt(x) != null);
  const base = extraProducts.length ? flavorPrice([s.price, ...extraProducts.map((x) => priceAt(x)!)]) : s.price;
  const chosen = p.addons.filter((a) => addons.includes(a.name));
  const unit = base + chosen.reduce((t, a) => t + a.price, 0);
  const full = extra.length >= maxFlavors - 1;

  const chooseSize = (name: string) => {
    setSize(name);
    const max = p.sizes.find((z) => z.name === name)?.flavors ?? 1;
    setExtra((cur) => cur.slice(0, Math.max(0, max - 1)));
  };

  return (
    <Modal
      open
      wide={maxFlavors > 1}
      onClose={onClose}
      title={p.name}
      footer={
        <>
          <div className="mr-auto flex items-center rounded-xl border border-cream-200 bg-white">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center" aria-label="Diminuir">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center font-black">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center" aria-label="Aumentar">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button variant="flame" onClick={() => onAdd({ product: p, flavors: extraProducts, size: s.name, addons: chosen, notes: notes.trim(), qty, unit })}>
            Adicionar · {money(unit * qty)}
          </Button>
        </>
      }
    >
      {p.sizes.length > 1 && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {p.sizes.map((x) => (
            <button key={x.name} onClick={() => chooseSize(x.name)} className={`rounded-xl border p-3 text-left ${x.name === size ? "border-ink-950 bg-ink-950 text-white" : "border-cream-200"}`}>
              <span className="block text-sm font-bold">{x.name}</span>
              <span className="text-sm opacity-75">{money(x.price)}</span>
              {(x.flavors ?? 1) > 1 && <span className="block text-[11px] font-semibold opacity-60">até {x.flavors} sabores</span>}
            </button>
          ))}
        </div>
      )}
      {maxFlavors > 1 && (
        <div className="mb-4">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-600">
            Sabores ({1 + extraProducts.length}/{maxFlavors}) · média dos preços
          </span>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-gold-400 px-3 py-1.5 text-xs font-bold text-ink-950">
              1/{1 + extraProducts.length} {p.name}
            </span>
            {extraProducts.map((x) => (
              <button key={x.id} onClick={() => setExtra((c) => c.filter((id) => id !== x.id))} className="rounded-full bg-gold-400 px-3 py-1.5 text-xs font-bold text-ink-950" aria-label={`Remover ${x.name}`}>
                1/{1 + extraProducts.length} {x.name} ✕
              </button>
            ))}
          </div>
          {!full && (
            <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-cream-200 p-2">
              {candidates
                .filter((x) => !extra.includes(x.id))
                .map((x) => (
                  <button key={x.id} onClick={() => setExtra((c) => [...c, x.id])} className="rounded-full bg-cream-100 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-cream-200">
                    + {x.name} <span className="font-semibold text-ink-500">{money(priceAt(x)!)}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
      {p.addons.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {p.addons.map((a) => {
            const on = addons.includes(a.name);
            return (
              <button key={a.name} onClick={() => setAddons((c) => (on ? c.filter((x) => x !== a.name) : [...c, a.name]))} aria-pressed={on} className={`rounded-full px-3 py-1.5 text-xs font-bold ${on ? "bg-gold-400 text-ink-950" : "bg-cream-100 text-ink-700"}`}>
                {a.name} +{money(a.price)}
              </button>
            );
          })}
        </div>
      )}
      <Field label="Observações do item">
        <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: sem cebola" />
      </Field>
    </Modal>
  );
}
