"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bike, CheckCircle2, Clock, CreditCard, Flame, MapPin, MessageCircle, ShoppingBag, Wheat } from "lucide-react";
import { useStore } from "./cart";
import { scrollToId } from "./Header";
import { mapsLink, money, waLink } from "@/lib/format";
import { WEEKDAYS } from "@/lib/types";

function Instagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".6" fill="currentColor" />
    </svg>
  );
}

const BENEFITS = [
  { Icon: Wheat, title: "Ingredientes selecionados", text: "Queijos, molho e recheios de primeira." },
  { Icon: Flame, title: "Pizza feita na hora", text: "Montada e assada só depois do seu pedido." },
  { Icon: Bike, title: "Entrega rápida", text: "Quentinha na sua porta." },
  { Icon: CreditCard, title: "Pagamento fácil", text: "Pix, cartão ou dinheiro." },
];

export function Benefits() {
  return (
    <section className="border-y border-white/[0.06] bg-ink-900">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/[0.06] lg:grid-cols-4">
        {BENEFITS.map(({ Icon, title, text }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex flex-col gap-3 bg-ink-900 p-5 sm:flex-row sm:items-center sm:p-8"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-400/10 text-gold-400">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-extrabold leading-tight">{title}</p>
              <p className="mt-1 text-sm text-white/50">{text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function About() {
  const { settings } = useStore();
  return (
    <section id="sobre" className="relative overflow-hidden bg-ink-950 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.aboutImage} alt="Pizza saindo do forno" loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.logo} alt="" loading="lazy" className="absolute -bottom-8 -right-3 w-36 drop-shadow-[0_20px_30px_rgba(0,0,0,.7)] sm:w-48" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-gold-400">Sobre nós</p>
          <h2 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl">
            O SABOR DE <span className="text-gold">SÃO PAULO</span> EM ANDARAÍ
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/60">
            Inspirados nas pizzarias da maior cidade do país, trouxemos para Piritiba a pizza de massa leve, borda dourada e recheio generoso. Tudo preparado na hora, com carinho e
            ingredientes de qualidade.
          </p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-400">
                <Clock className="h-4 w-4" /> Horário
              </dt>
              <dd className="mt-2 font-semibold">{settings.hoursText}</dd>
              <dd className="mt-3 flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d, i) => (
                  <span key={d} className={`rounded-md px-2 py-0.5 text-xs font-bold ${settings.days.includes(i) ? "bg-gold-400/15 text-gold-300" : "bg-white/5 text-white/25 line-through"}`}>
                    {d}
                  </span>
                ))}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-400">
                <MapPin className="h-4 w-4" /> Endereço
              </dt>
              <dd className="mt-2 font-semibold">
                {settings.address}
                {settings.city ? ` — ${settings.city}` : ""}
              </dd>
              <a href={mapsLink([settings.address, settings.city])} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-bold text-gold-300 hover:underline">
                Ver no mapa →
              </a>
            </div>
          </dl>
        </motion.div>
      </div>
    </section>
  );
}

export function FinalCta() {
  const { settings } = useStore();
  return (
    <section className="grain relative overflow-hidden bg-gradient-to-br from-[#3a0f06] via-[#1a0805] to-ink-950 py-20 sm:py-28">
      <div className="absolute -right-[20vw] top-1/2 aspect-square w-[70vw] max-w-[760px] -translate-y-1/2 opacity-90 max-sm:-right-[35vw] max-sm:w-[95vw] max-sm:opacity-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={settings.heroImage} alt="" loading="lazy" className="h-full w-full animate-spin-slow drop-shadow-[0_40px_60px_rgba(0,0,0,.7)]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="max-w-xl">
          <h2 className="font-display text-7xl leading-[0.85] sm:text-8xl lg:text-9xl">
            DEU
            <br />
            <span className="text-gold">VONTADE?</span>
          </h2>
          <p className="mt-5 text-xl text-white/70">Peça sua pizza favorita.</p>
          <button onClick={() => scrollToId("#cardapio")} className="btn btn-flame mt-8 h-16 px-10 text-lg">
            PEDIR AGORA
          </button>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  const { settings } = useStore();
  const insta = settings.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
  return (
    <footer id="contato" className="border-t border-white/[0.06] bg-ink-950 pb-28 pt-16 sm:pb-12">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.logo} alt={settings.storeName} loading="lazy" className="w-40" />
          <p className="mt-4 max-w-xs text-sm text-white/45">{settings.tagline}. Pizza artesanal feita na hora em {settings.address}.</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-400">Contato</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/75 hover:text-white">
                <MessageCircle className="h-4 w-4 text-[#25D366]" /> {settings.phone}
              </a>
            </li>
            {insta && (
              <li>
                <a href={`https://instagram.com/${encodeURIComponent(insta)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/75 hover:text-white">
                  <Instagram className="h-4 w-4 text-gold-400" /> @{insta}
                </a>
              </li>
            )}
            <li className="inline-flex items-center gap-2 text-white/75">
              <MapPin className="h-4 w-4 text-gold-400" /> {settings.address}
              {settings.city ? `, ${settings.city}` : ""}
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-400">Funcionamento</p>
          <p className="mt-4 text-sm text-white/75">{settings.hoursText}</p>
          <p className="mt-2 text-sm text-white/45">Tempo médio de entrega: {settings.deliveryTime}</p>
          <p className="mt-2 text-sm text-white/45">Taxa de entrega: {settings.deliveryFee ? money(settings.deliveryFee) : "grátis"}</p>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-4 pt-6 text-xs text-white/30 sm:px-6">
        <span>
          © {new Date().getFullYear()} {settings.storeName}. Todos os direitos reservados.
        </span>
        <a href="/admin" className="hover:text-white/60">
          Área do lojista
        </a>
      </div>
    </footer>
  );
}

export function FloatingCart() {
  const { count, subtotal, setCartOpen, cartOpen, modal } = useStore();
  return (
    <AnimatePresence>
      {count > 0 && !cartOpen && !modal && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:hidden">
          <button onClick={() => setCartOpen(true)} className="btn btn-flame h-14 w-full justify-between rounded-2xl px-5 text-base">
            <span className="flex items-center gap-2">
              <span className="relative">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-black text-flame-600">{count}</span>
              </span>
              Ver carrinho
            </span>
            <span className="tabular-nums">{money(subtotal)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toast() {
  const { toast } = useStore();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          className="fixed left-1/2 top-20 z-[60] flex items-center gap-2 rounded-full border border-emerald-400/30 bg-ink-800/95 px-4 py-2.5 text-sm font-bold shadow-2xl backdrop-blur"
          role="status"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-400" /> {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
