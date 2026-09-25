"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useStore } from "./cart";
import { minPrice, money } from "@/lib/format";
import type { Product } from "@/lib/types";

export function productBadge(p: Product): { label: string; cls: string } | null {
  if (p.isPromo) return { label: "Promoção", cls: "bg-flame-500 text-white" };
  if (p.isBest) return { label: "Mais pedida", cls: "bg-gold-400 text-ink-950" };
  if (p.isNew) return { label: "Novidade", cls: "bg-white text-ink-950" };
  return null;
}

/** Produto simples (1 tamanho, sem adicionais) pode ir direto ao carrinho. */
export function isSimple(p: Product) {
  return p.sizes.length === 1 && p.addons.length === 0;
}

export function priceInfo(p: Product) {
  const min = minPrice(p.sizes);
  const promoSize = p.sizes.find((s) => s.oldPrice && s.oldPrice > s.price);
  return {
    from: p.sizes.length > 1,
    price: promoSize ? promoSize.price : min,
    oldPrice: promoSize?.oldPrice ?? null,
    promoLabel: promoSize && p.sizes.length > 1 ? promoSize.name : null,
  };
}

export function ProductImage({ p, className = "" }: { p: Product; className?: string }) {
  return p.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.image} alt={p.name} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />
  ) : (
    <div className={`grid h-full w-full place-items-center bg-gradient-to-br from-ink-700 to-ink-850 font-display text-4xl text-gold-500/40 ${className}`}>
      {p.name.slice(0, 1)}
    </div>
  );
}

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { openProduct, add, showToast } = useStore();
  const badge = productBadge(p);
  const info = priceInfo(p);

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSimple(p)) {
      add({ productId: p.id, name: p.name, image: p.image, size: p.sizes[0].name, unitPrice: p.sizes[0].price, addons: [], notes: "", qty: 1 });
      showToast(`${p.name} adicionado ao carrinho`);
    } else openProduct(p);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
      whileTap={{ scale: 0.98 }}
      onClick={() => openProduct(p)}
      className="group relative flex cursor-pointer gap-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-900 p-2.5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-gold-400/30 hover:shadow-[0_24px_50px_-24px_rgba(245,194,56,.35)] min-[400px]:flex-col min-[400px]:gap-0 min-[400px]:p-0"
    >
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-ink-800 min-[400px]:aspect-[4/3] min-[400px]:w-full min-[400px]:rounded-none">
        <ProductImage p={p} className="transition-transform duration-500 ease-out group-hover:scale-[1.07]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent max-[399px]:hidden" />
        {badge && (
          <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg sm:left-3 sm:top-3 ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1 min-[400px]:p-3.5 sm:p-4">
        <h3 className="text-[15px] font-extrabold leading-tight sm:text-base">{p.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/55">{p.description}</p>
        {p.ingredients.length > 0 && (
          <p className="mt-1.5 line-clamp-1 text-[11px] font-medium text-gold-300/60 max-sm:hidden">{p.ingredients.join(" · ")}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="leading-none">
            {info.from && <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/40">a partir de</span>}
            {info.oldPrice && <span className="mr-1.5 text-xs text-white/40 line-through">{money(info.oldPrice)}</span>}
            <span className={`text-lg font-black sm:text-xl ${info.oldPrice ? "text-flame-400" : "text-gold-300"}`}>{money(info.price)}</span>
          </div>
          <button
            onClick={quickAdd}
            aria-label={`Adicionar ${p.name}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-flame-500 text-white shadow-[0_8px_20px_-6px_rgba(255,90,31,.7)] transition-transform duration-200 hover:scale-110 hover:bg-flame-400 active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
