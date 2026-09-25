"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, X } from "lucide-react";
import { useLockBody, useStore } from "./cart";
import { ProductImage, productBadge } from "./ProductCard";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductModal() {
  const { modal, closeProduct } = useStore();
  useLockBody(!!modal);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeProduct();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, closeProduct]);

  return (
    <AnimatePresence>
      {modal && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeProduct} />
          <Body key={modal.product.id + (modal.editing?.key ?? "")} product={modal.product} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Body({ product: p }: { product: Product }) {
  const { modal, closeProduct, add, replace, showToast, setCartOpen } = useStore();
  const editing = modal?.editing;
  const defaultSize = p.sizes.find((s) => s.name === "Grande")?.name ?? p.sizes[0]?.name ?? "";
  const [size, setSize] = useState(editing?.size ?? defaultSize);
  const [addons, setAddons] = useState<string[]>(editing?.addons.map((a) => a.name) ?? []);
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [qty, setQty] = useState(editing?.qty ?? 1);

  const sizeObj = p.sizes.find((s) => s.name === size) ?? p.sizes[0];
  const chosen = p.addons.filter((a) => addons.includes(a.name));
  const unit = (sizeObj?.price ?? 0) + chosen.reduce((s, a) => s + a.price, 0);
  const badge = productBadge(p);

  const toggle = (name: string) => setAddons((cur) => (cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]));

  const submit = () => {
    const item = { productId: p.id, name: p.name, image: p.image, size: sizeObj.name, unitPrice: unit, addons: chosen, notes: notes.trim(), qty };
    if (editing) {
      replace(editing.key, item);
      closeProduct();
      setCartOpen(true);
    } else {
      add(item);
      closeProduct();
      showToast(`${qty}x ${p.name} adicionado ao carrinho`);
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label={p.name}
      initial={{ y: 60, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 60, opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="relative flex max-h-[94svh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-ink-900 shadow-2xl sm:max-h-[88vh] sm:max-w-4xl sm:flex-row sm:rounded-[28px]"
    >
      <button onClick={closeProduct} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80" aria-label="Fechar">
        <X className="h-5 w-5" />
      </button>

      <div className="relative h-60 shrink-0 overflow-hidden bg-ink-800 sm:h-auto sm:w-[46%]">
        <motion.div initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }} className="h-full w-full">
          <ProductImage p={p} />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/10 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-ink-900/40" />
        {badge && <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${badge.cls}`}>{badge.label}</span>}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-1 sm:px-7 sm:pt-7">
          <h2 className="font-display text-4xl leading-none tracking-wide sm:text-5xl">{p.name.toUpperCase()}</h2>
          {p.description && <p className="mt-3 text-[15px] leading-relaxed text-white/65">{p.description}</p>}

          {p.ingredients.length > 0 && (
            <section className="mt-5">
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">Ingredientes</h3>
              <ul className="flex flex-wrap gap-2">
                {p.ingredients.map((ing) => (
                  <li key={ing} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[13px] font-semibold text-white/85">
                    {ing}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.sizes.length > 1 && (
            <section className="mt-6">
              <h3 className="mb-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
                Tamanho <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] tracking-wider text-white/60">obrigatório</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {p.sizes.map((s) => {
                  const active = s.name === size;
                  return (
                    <button
                      key={s.name}
                      onClick={() => setSize(s.name)}
                      className={`relative rounded-2xl border p-3.5 text-left transition ${
                        active ? "border-gold-400 bg-gold-400/10 shadow-[0_0_0_3px_rgba(245,194,56,.15)]" : "border-white/10 bg-white/[0.03] hover:border-white/25"
                      }`}
                    >
                      <span className="block text-sm font-extrabold">{s.name}</span>
                      <span className="mt-0.5 block text-sm">
                        {s.oldPrice && s.oldPrice > s.price && <span className="mr-1 text-xs text-white/40 line-through">{money(s.oldPrice)}</span>}
                        <span className={active ? "font-bold text-gold-300" : "text-white/60"}>{money(s.price)}</span>
                      </span>
                      {active && (
                        <motion.span layoutId="size-check" className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-gold-400 text-ink-950">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {p.addons.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
                Adicionais <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] tracking-wider text-white/60">opcional</span>
              </h3>
              <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/10">
                {p.addons.map((a) => {
                  const on = addons.includes(a.name);
                  return (
                    <li key={a.name}>
                      <button onClick={() => toggle(a.name)} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${on ? "bg-gold-400/[0.08]" : "hover:bg-white/[0.03]"}`}>
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition ${on ? "border-gold-400 bg-gold-400 text-ink-950" : "border-white/25"}`}>
                          {on && <Check className="h-4 w-4" strokeWidth={3} />}
                        </span>
                        <span className="flex-1 text-[15px] font-semibold">{a.name}</span>
                        <span className="text-sm font-bold text-gold-300">+ {money(a.price)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="mt-6">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">Observações</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 300))}
              rows={2}
              placeholder="Ex.: sem cebola, bem assada, cortar em 8 pedaços…"
              className="field resize-none"
            />
          </section>
        </div>

        <div className="flex items-center gap-3 border-t border-white/[0.07] bg-ink-900/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-7">
          <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04]">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-11 place-items-center text-white/80 disabled:opacity-30" disabled={qty <= 1} aria-label="Diminuir">
              <Minus className="h-4 w-4" strokeWidth={3} />
            </button>
            <span className="w-6 text-center text-lg font-black tabular-nums">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(50, q + 1))} className="grid h-12 w-11 place-items-center text-white/80" aria-label="Aumentar">
              <Plus className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
          <button onClick={submit} className="btn btn-flame h-12 flex-1 justify-between px-5 text-[15px]">
            <span className="whitespace-nowrap">
              {editing ? "Salvar" : "Adicionar"}
              <span className="max-[420px]:hidden">{editing ? " alterações" : " ao carrinho"}</span>
            </span>
            <motion.span key={unit * qty} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular-nums">
              {money(unit * qty)}
            </motion.span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
