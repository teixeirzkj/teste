"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bike, Check, MessageCircle, Minus, Pencil, Plus, ShoppingBag, Store, Trash2, X } from "lucide-react";
import { useLockBody, useStore, type CartItem } from "./cart";
import { centsToInput, formatPhone, money, parseMoney } from "@/lib/format";
import type { DeliveryType } from "@/lib/types";

type Step = "cart" | "checkout" | "done";
type Customer = {
  customerName: string;
  phone: string;
  street: string;
  number: string;
  district: string;
  complement: string;
  reference: string;
  city: string;
};
const CUSTOMER_KEY = "psp-customer-v1";

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useStore();
  const [step, setStep] = useState<Step>("cart");
  useLockBody(cartOpen);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  const close = () => {
    setCartOpen(false);
    if (step === "done") window.setTimeout(() => setStep("cart"), 400);
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            className="absolute inset-y-0 right-0 flex w-full flex-col bg-ink-900 shadow-2xl sm:max-w-[460px] sm:border-l sm:border-white/10"
          >
            <Content step={step} setStep={setStep} close={close} />
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Content({ step, setStep, close }: { step: Step; setStep: (s: Step) => void; close: () => void }) {
  const [result, setResult] = useState<{ number: number; total: number; url: string; name: string } | null>(null);
  const titles: Record<Step, string> = { cart: "SEU CARRINHO", checkout: "ENTREGA E PAGAMENTO", done: "PEDIDO ENVIADO" };

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.07] px-4">
        {step === "checkout" ? (
          <button onClick={() => setStep("cart")} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/5" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-400/10 text-gold-400">
            <ShoppingBag className="h-5 w-5" />
          </span>
        )}
        <h2 className="flex-1 font-display text-2xl tracking-wide">{titles[step]}</h2>
        <button onClick={close} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/5" aria-label="Fechar">
          <X className="h-5 w-5" />
        </button>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: step === "cart" ? -24 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: step === "cart" ? 24 : -24 }}
          transition={{ duration: 0.22 }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {step === "cart" && <CartStep next={() => setStep("checkout")} close={close} />}
          {step === "checkout" && (
            <CheckoutStep
              onDone={(r) => {
                setResult(r);
                setStep("done");
              }}
            />
          )}
          {step === "done" && result && <DoneStep result={result} close={close} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function CartStep({ next, close }: { next: () => void; close: () => void }) {
  const { items, subtotal, settings } = useStore();
  if (!items.length)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white/[0.04]">
          <ShoppingBag className="h-10 w-10 text-white/30" />
        </div>
        <p className="font-display text-3xl">CARRINHO VAZIO</p>
        <p className="max-w-xs text-white/55">Escolha sua pizza favorita no cardápio e ela aparece aqui.</p>
        <button onClick={close} className="btn btn-gold mt-2 h-12 px-7">
          Ver cardápio
        </button>
      </div>
    );
  return (
    <>
      <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <CartLine key={it.key} it={it} />
          ))}
        </AnimatePresence>
      </ul>
      <div className="shrink-0 space-y-2 border-t border-white/[0.07] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Row label="Subtotal" value={money(subtotal)} />
        <Row label="Taxa de entrega" value={settings.deliveryFee ? money(settings.deliveryFee) : "Grátis"} muted />
        <Row label="Total" value={money(subtotal + settings.deliveryFee)} big />
        <p className="text-xs text-white/40">A taxa não é cobrada se você escolher retirar no local.</p>
        <button onClick={next} className="btn btn-flame mt-2 h-14 w-full text-base">
          Continuar para entrega
        </button>
      </div>
    </>
  );
}

function CartLine({ it }: { it: CartItem }) {
  const { setQty, remove, openProduct, products, setCartOpen } = useStore();
  const product = products.find((p) => p.id === it.productId);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }}
      className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-800">
        {it.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={it.image} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-extrabold leading-tight">
            {it.name}
            {it.size !== "Único" && <span className="font-semibold text-white/50"> · {it.size}</span>}
          </p>
          <button onClick={() => remove(it.key)} className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/40 hover:bg-white/5 hover:text-flame-400" aria-label="Remover">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {it.addons.length > 0 && <p className="mt-0.5 text-xs text-gold-300/70">+ {it.addons.map((a) => a.name).join(", ")}</p>}
        {it.notes && <p className="mt-0.5 line-clamp-2 text-xs italic text-white/45">“{it.notes}”</p>}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center rounded-full border border-white/10">
            <button onClick={() => setQty(it.key, it.qty - 1)} className="grid h-8 w-8 place-items-center" aria-label="Diminuir">
              <Minus className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
            <span className="w-5 text-center text-sm font-black tabular-nums">{it.qty}</span>
            <button onClick={() => setQty(it.key, it.qty + 1)} className="grid h-8 w-8 place-items-center" aria-label="Aumentar">
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
          </div>
          {product && !(product.sizes.length === 1 && product.addons.length === 0) && (
            <button
              onClick={() => {
                setCartOpen(false);
                openProduct(product, it);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-white/55 hover:text-gold-300"
            >
              <Pencil className="h-3 w-3" /> Editar
            </button>
          )}
          <span className="font-black tabular-nums text-gold-300">{money(it.unitPrice * it.qty)}</span>
        </div>
      </div>
    </motion.li>
  );
}

function Row({ label, value, muted, big }: { label: string; value: string; muted?: boolean; big?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${big ? "pt-1 text-lg font-black" : "text-sm"} ${muted ? "text-white/55" : ""}`}>
      <span>{label}</span>
      <span className={`tabular-nums ${big ? "text-gold-300" : ""}`}>{value}</span>
    </div>
  );
}

function CheckoutStep({ onDone }: { onDone: (r: { number: number; total: number; url: string; name: string }) => void }) {
  const { items, subtotal, settings, clear } = useStore();
  const payments = settings.payments.filter((p) => p.active);
  const [c, setC] = useState<Customer>({ customerName: "", phone: "", street: "", number: "", district: "", complement: "", reference: "", city: settings.city });
  const [delivery, setDelivery] = useState<DeliveryType>("delivery");
  const [payment, setPayment] = useState("");
  const [needChange, setNeedChange] = useState(false);
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setC((cur) => ({ ...cur, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  const fee = delivery === "delivery" ? settings.deliveryFee : 0;
  const total = subtotal + fee;
  const payObj = payments.find((p) => p.name === payment);
  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setC((cur) => ({ ...cur, [k]: k === "phone" ? formatPhone(e.target.value) : e.target.value }));

  const validate = (): string | null => {
    if (c.customerName.trim().length < 2) return "Informe seu nome completo.";
    if (c.phone.replace(/\D/g, "").length < 10) return "Informe um telefone/WhatsApp válido com DDD.";
    if (delivery === "delivery" && (!c.street.trim() || !c.number.trim() || !c.district.trim())) return "Preencha rua, número e bairro.";
    if (!payment) return "Escolha a forma de pagamento.";
    if (payObj?.allowChange && needChange) {
      const v = parseMoney(changeFor);
      if (!v) return "Informe para quanto precisa de troco.";
      if (v < total) return `O troco precisa ser maior que o total (${money(total)}).`;
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    setError(err);
    if (err) return;
    if (!settings.isOpen) {
      setError(settings.closedMessage);
      return;
    }
    setSending(true);
    // Abre a aba já no clique (evita bloqueio de pop-up) e depois aponta para o WhatsApp.
    const win = window.open("", "_blank");
    if (win) win.opener = null;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: c.customerName,
          phone: c.phone,
          deliveryType: delivery,
          address: { street: c.street, number: c.number, district: c.district, complement: c.complement, reference: c.reference, city: c.city },
          payment,
          changeFor: payObj?.allowChange && needChange ? parseMoney(changeFor) : null,
          notes,
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            qty: i.qty,
            addons: i.addons.map((a) => a.name),
            flavors: (i.flavors ?? []).map((f) => f.id),
            notes: i.notes,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível enviar o pedido.");
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(c));
      } catch {}
      if (win) win.location.href = data.whatsappUrl;
      else window.location.href = data.whatsappUrl;
      clear();
      onDone({ number: data.order.number, total: data.order.total, url: data.whatsappUrl, name: c.customerName.split(" ")[0] });
    } catch (e) {
      win?.close();
      setError(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  };

  const label = "mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-white/50";
  const section = "text-xs font-bold uppercase tracking-[0.18em] text-gold-400";

  return (
    <>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 pb-8">
        <section className="space-y-3">
          <h3 className={section}>Seus dados</h3>
          <div>
            <label className={label} htmlFor="ck-name">Nome completo</label>
            <input id="ck-name" className="field" value={c.customerName} onChange={set("customerName")} autoComplete="name" placeholder="Seu nome" />
          </div>
          <div>
            <label className={label} htmlFor="ck-phone">Telefone / WhatsApp</label>
            <input id="ck-phone" className="field" value={c.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="(74) 99999-9999" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className={section}>Forma de entrega</h3>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { v: "delivery", label: "Entrega", sub: settings.deliveryFee ? money(settings.deliveryFee) : "Grátis", Icon: Bike },
                { v: "pickup", label: "Retirada", sub: "No local", Icon: Store },
              ] as const
            ).map(({ v, label: l, sub, Icon }) => (
              <button
                key={v}
                onClick={() => setDelivery(v)}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${delivery === v ? "border-gold-400 bg-gold-400/10" : "border-white/10 bg-white/[0.03]"}`}
              >
                <Icon className={`h-6 w-6 ${delivery === v ? "text-gold-400" : "text-white/40"}`} />
                <span>
                  <span className="block font-extrabold">{l}</span>
                  <span className="block text-xs text-white/50">{sub}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <AnimatePresence initial={false}>
          {delivery === "delivery" && (
            <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
              <h3 className={section}>Endereço</h3>
              <div className="grid grid-cols-[1fr_96px] gap-2">
                <div>
                  <label className={label} htmlFor="ck-street">Rua</label>
                  <input id="ck-street" className="field" value={c.street} onChange={set("street")} autoComplete="address-line1" placeholder="Nome da rua" />
                </div>
                <div>
                  <label className={label} htmlFor="ck-number">Número</label>
                  <input id="ck-number" className="field" value={c.number} onChange={set("number")} inputMode="numeric" placeholder="Nº" />
                </div>
              </div>
              <div>
                <label className={label} htmlFor="ck-district">Bairro</label>
                <input id="ck-district" className="field" value={c.district} onChange={set("district")} placeholder="Bairro" />
              </div>
              <div>
                <label className={label} htmlFor="ck-comp">Complemento</label>
                <input id="ck-comp" className="field" value={c.complement} onChange={set("complement")} placeholder="Casa, apto, bloco… (opcional)" />
              </div>
              <div>
                <label className={label} htmlFor="ck-ref">Referência</label>
                <input id="ck-ref" className="field" value={c.reference} onChange={set("reference")} placeholder="Perto de… (opcional)" />
              </div>
              <div>
                <label className={label} htmlFor="ck-city">Cidade</label>
                <input id="ck-city" className="field" value={c.city} onChange={set("city")} autoComplete="address-level2" />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="space-y-3">
          <h3 className={section}>Pagamento</h3>
          <div className="grid grid-cols-2 gap-2">
            {payments.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPayment(p.name);
                  if (!p.allowChange) setNeedChange(false);
                }}
                className={`rounded-2xl border px-3.5 py-3 text-left text-sm font-extrabold transition ${payment === p.name ? "border-gold-400 bg-gold-400/10 text-white" : "border-white/10 bg-white/[0.03] text-white/75"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <AnimatePresence initial={false}>
            {payObj?.allowChange && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                <p className="pt-1 font-bold">Precisa de troco?</p>
                <div className="flex gap-2">
                  {[
                    { v: false, l: "Não" },
                    { v: true, l: "Sim" },
                  ].map((o) => (
                    <button
                      key={o.l}
                      onClick={() => setNeedChange(o.v)}
                      className={`h-11 flex-1 rounded-full border text-sm font-bold transition ${needChange === o.v ? "border-gold-400 bg-gold-400/10" : "border-white/10"}`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
                {needChange && (
                  <div>
                    <label className={label} htmlFor="ck-change">Troco para quanto?</label>
                    <input
                      id="ck-change"
                      className="field"
                      inputMode="decimal"
                      placeholder={`Ex.: ${centsToInput(Math.ceil(total / 5000) * 5000)}`}
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value.replace(/[^\d,.]/g, ""))}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="space-y-3">
          <h3 className={section}>Observações do pedido</h3>
          <textarea className="field resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 400))} placeholder="Algo mais que devemos saber? (opcional)" />
        </section>
      </div>

      <div className="shrink-0 space-y-2 border-t border-white/[0.07] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Row label="Subtotal" value={money(subtotal)} />
        {delivery === "delivery" && <Row label="Taxa de entrega" value={fee ? money(fee) : "Grátis"} muted />}
        <Row label="Total" value={money(total)} big />
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-flame-500/30 bg-flame-500/10 px-3 py-2 text-sm font-semibold text-flame-400" role="alert">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        {!settings.isOpen && <p className="text-center text-sm font-bold text-flame-400">{settings.closedMessage}</p>}
        <button onClick={submit} disabled={sending || !items.length || !settings.isOpen} className="btn btn-flame mt-1 h-14 w-full text-base">
          {sending ? "Enviando…" : "FINALIZAR PEDIDO"}
        </button>
        <p className="text-center text-xs text-white/40">Você será direcionado ao WhatsApp com o pedido pronto.</p>
      </div>
    </>
  );
}

function DoneStep({ result, close }: { result: { number: number; total: number; url: string; name: string }; close: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="grid h-24 w-24 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_0_12px_rgba(16,185,129,.15)]"
      >
        <Check className="h-12 w-12" strokeWidth={3} />
      </motion.div>
      <div>
        <p className="font-display text-4xl">VALEU, {result.name.toUpperCase()}!</p>
        <p className="mt-2 text-white/60">
          Pedido <b className="text-gold-300">nº {result.number}</b> registrado — total <b className="text-white">{money(result.total)}</b>.
        </p>
        <p className="mt-3 max-w-xs text-sm text-white/50">Abrimos o WhatsApp com todos os detalhes. É só tocar em enviar para confirmar com a pizzaria.</p>
      </div>
      <a href={result.url} target="_blank" rel="noopener noreferrer" className="btn h-14 w-full max-w-xs bg-[#25D366] text-base text-ink-950 hover:bg-[#3be07a]">
        <MessageCircle className="h-5 w-5" /> Abrir WhatsApp novamente
      </a>
      <button onClick={close} className="btn btn-ghost h-12 w-full max-w-xs">
        Voltar ao cardápio
      </button>
    </div>
  );
}
