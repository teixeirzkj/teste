"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, Sparkles, X } from "lucide-react";
import { useStore } from "./cart";
import { ProductCard, ProductImage, priceInfo } from "./ProductCard";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function MenuSection() {
  const { categories, products, settings } = useStore();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<number | null>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const byCat = useMemo(
    () =>
      categories
        .map((c) => ({ c, items: products.filter((p) => p.categoryId === c.id) }))
        .filter((g) => g.items.length > 0),
    [categories, products]
  );
  const promos = products.filter((p) => p.isPromo);
  const best = products.filter((p) => p.isBest);
  const results = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return null;
    return products.filter((p) => norm(`${p.name} ${p.description} ${p.ingredients.join(" ")}`).includes(t));
  }, [q, products]);

  // Destaca a categoria visível.
  useEffect(() => {
    if (results) return;
    const els = byCat.map((g) => document.getElementById(`cat-${g.c.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(Number(vis.target.id.replace("cat-", "")));
      },
      { rootMargin: "-140px 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [byCat, results]);

  useEffect(() => {
    const box = chipsRef.current;
    const chip = box?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    // Rola só a barra de categorias (scrollIntoView interromperia a rolagem da página).
    if (box && chip) box.scrollTo({ left: chip.offsetLeft - box.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const jump = (id: number) => {
    setQ("");
    requestAnimationFrame(() => {
      const el = document.getElementById(`cat-${id}`);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 136, behavior: "smooth" });
    });
  };

  return (
    <section id="cardapio" className="relative bg-ink-950 pb-20 pt-8 sm:pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-gold-500/[0.06] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-gold-400">Cardápio</p>
          <h2 className="mt-3 font-display text-5xl leading-none sm:text-7xl">
            ESCOLHA SUA <span className="text-gold">PIZZA</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/55">Feita na hora, do jeito que você gosta. Escolha, personalize e finalize em poucos toques.</p>
          {!settings.isOpen && (
            <p className="mx-auto mt-5 w-fit rounded-full border border-flame-500/30 bg-flame-500/10 px-4 py-2 text-sm font-bold text-flame-400">
              {settings.closedMessage} Você pode montar seu pedido e enviar quando abrirmos.
            </p>
          )}
        </motion.div>

        <div className="mx-auto mt-8 max-w-xl">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar pizza, ingrediente…"
              className="field h-14 rounded-full pl-12 pr-12 text-base"
              aria-label="Buscar no cardápio"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/10" aria-label="Limpar busca">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
        </div>
      </div>

      {/* Categorias (fixas ao rolar) */}
      <div className="sticky top-16 z-30 mt-6 border-y border-white/[0.06] bg-ink-950/85 backdrop-blur-xl">
        <div ref={chipsRef} className="no-scrollbar relative mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {byCat.map(({ c }) => {
            const on = active === c.id && !results;
            return (
              <button
                key={c.id}
                data-cat={c.id}
                onClick={() => jump(c.id)}
                className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${on ? "text-ink-950" : "bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {on && <motion.span layoutId="chip" className="absolute inset-0 rounded-full bg-gold-400" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                <span className="relative">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {results ? (
          <div className="pt-8">
            <p className="mb-4 text-sm text-white/55">
              {results.length} resultado{results.length === 1 ? "" : "s"} para <b className="text-white">“{q}”</b>
            </p>
            {results.length ? (
              <Grid items={results} />
            ) : (
              <p className="rounded-2xl border border-white/10 p-10 text-center text-white/50">Nada encontrado. Tente outro sabor ou ingrediente.</p>
            )}
          </div>
        ) : (
          <>
            {promos.length > 0 && <Offers items={promos} />}
            {best.length > 0 && <BestSellers items={best} />}
            {byCat.map(({ c, items }) => (
              <div key={c.id} id={`cat-${c.id}`} className="scroll-mt-36 pt-14">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <h3 className="font-display text-3xl tracking-wide sm:text-4xl">{c.name.toUpperCase()}</h3>
                  <span className="pb-1 text-sm text-white/40">{items.length} opções</span>
                </div>
                <Grid items={items} />
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}

function Grid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p, i) => (
        <ProductCard key={p.id} p={p} index={i} />
      ))}
    </div>
  );
}

function Offers({ items }: { items: Product[] }) {
  const { openProduct } = useStore();
  const [carRef, car] = useCarousel(items.length);
  return (
    <div className="pt-12">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-flame-500/15 text-flame-400">
          <Sparkles className="h-5 w-5" />
        </span>
        <h3 className="flex-1 font-display text-3xl tracking-wide sm:text-4xl">OFERTAS DA SEMANA</h3>
        <CarouselArrows car={car} label="ofertas" />
      </div>
      <div ref={carRef} onScroll={car.onScroll} className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-smooth gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {items.map((p, i) => {
          const info = priceInfo(p);
          const off = info.oldPrice ? Math.round((1 - info.price / info.oldPrice) * 100) : 0;
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              onClick={() => openProduct(p)}
              className="group relative flex h-56 w-[86vw] max-w-[560px] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#2a0f07] via-ink-900 to-ink-900 text-left sm:h-64"
            >
              <div className="relative z-10 flex w-[58%] flex-col justify-between p-5 sm:p-7">
                <div>
                  {off > 0 && <span className="inline-block rounded-full bg-flame-500 px-3 py-1 text-xs font-black text-white">{off}% OFF</span>}
                  <p className="mt-3 font-display text-3xl leading-[0.95] sm:text-4xl">{p.name.toUpperCase()}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-white/60">{p.description}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="leading-none">
                    {info.oldPrice && <span className="block text-xs text-white/40 line-through">{money(info.oldPrice)}</span>}
                    <span className="text-2xl font-black text-gold-300">{money(info.price)}</span>
                    {info.promoLabel && <span className="ml-1 text-xs text-white/50">({info.promoLabel})</span>}
                  </div>
                  <span className="btn btn-flame h-10 shrink-0 whitespace-nowrap px-4 text-xs">PEDIR</span>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 w-[55%]">
                <ProductImage p={p} className="transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/30 to-transparent" />
              </div>
            </motion.button>
          );
        })}
      </div>
      <CarouselDots car={car} count={items.length} label="oferta" />
    </div>
  );
}

function BestSellers({ items }: { items: Product[] }) {
  const { openProduct } = useStore();
  const [carRef, car] = useCarousel(items.length);
  return (
    <div className="pt-12">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="font-display text-3xl tracking-wide sm:text-4xl">
          AS <span className="text-gold">MAIS PEDIDAS</span>
        </h3>
        <CarouselArrows car={car} label="mais pedidas" />
      </div>
      <div ref={carRef} onScroll={car.onScroll} className="no-scrollbar -mx-4 flex snap-x scroll-smooth gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:gap-4 sm:px-6">
        {items.map((p, i) => {
          const info = priceInfo(p);
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              onClick={() => openProduct(p)}
              className="group relative h-72 w-52 shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 text-left sm:h-80 sm:w-60"
            >
              <ProductImage p={p} className="absolute inset-0 transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-gold-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-ink-950">
                {i === 0 ? "Favorita" : "Mais pedida"}
              </span>
              <span className="absolute right-3 top-3 font-display text-4xl leading-none text-white/25">#{i + 1}</span>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-display text-2xl leading-none">{p.name.toUpperCase()}</p>
                <p className="mt-1 line-clamp-1 text-xs text-white/60">{p.ingredients.join(", ")}</p>
                <p className="mt-2 text-lg font-black text-gold-300">
                  {info.from && <span className="mr-1 text-[10px] font-semibold uppercase text-white/50">a partir de</span>}
                  {money(info.price)}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

type Carousel = ReturnType<typeof useCarousel>[1];

/** Estado de um carrossel horizontal: setas habilitadas e item visível. */
function useCarousel(count: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ prev: false, next: count > 1, index: 0 });
  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const first = el.children[0] as HTMLElement | undefined;
    const step = first ? first.offsetWidth + 16 : el.clientWidth;
    setState({
      prev: el.scrollLeft > 4,
      next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      index: Math.min(count - 1, Math.round(el.scrollLeft / step)),
    });
  };
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  const go = (i: number) => {
    const el = ref.current;
    const child = el?.children[Math.max(0, Math.min(count - 1, i))] as HTMLElement | undefined;
    if (el && child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: "smooth" });
  };
  return [ref, { onScroll: measure, ...state, go }] as const;
}

function CarouselArrows({ car, label }: { car: Carousel; label: string }) {
  if (!car.prev && !car.next) return null;
  const cls =
    "grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white transition hover:border-gold-400/50 hover:bg-white/10 disabled:opacity-30 disabled:hover:border-white/10";
  return (
    <div className="flex shrink-0 gap-2">
      <button onClick={() => car.go(car.index - 1)} disabled={!car.prev} className={cls} aria-label={`Ver ${label} anteriores`}>
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={() => car.go(car.index + 1)} disabled={!car.next} className={cls} aria-label={`Ver mais ${label}`}>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function CarouselDots({ car, count, label }: { car: Carousel; count: number; label: string }) {
  if (count < 2) return null;
  return (
    <div className="mt-4 flex justify-center gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => car.go(i)}
          aria-label={`Ir para ${label} ${i + 1}`}
          aria-current={car.index === i}
          className="grid h-6 min-w-6 place-items-center"
        >
          <span className={`block h-2 rounded-full transition-all duration-300 ${car.index === i ? "w-6 bg-gold-400" : "w-2 bg-white/25"}`} />
        </button>
      ))}
    </div>
  );
}
