"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useStore } from "./cart";

const LINKS = [
  { href: "#inicio", label: "Início" },
  { href: "#cardapio", label: "Cardápio" },
  { href: "#sobre", label: "Sobre" },
  { href: "#contato", label: "Contato" },
];

export function scrollToId(id: string) {
  const el = document.getElementById(id.replace("#", ""));
  if (!el) return;
  const top = id === "#inicio" ? 0 : el.getBoundingClientRect().top + window.scrollY - 64;
  window.scrollTo({ top, behavior: "smooth" });
}

export function Header() {
  const { settings, count, setCartOpen, table } = useStore();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => {
      const menu = document.getElementById("cardapio");
      setSolid(!!menu && window.scrollY > menu.offsetTop - 140);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    scrollToId(href);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          solid || open ? "border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => go("#inicio")} className="flex items-center gap-3" aria-label="Início">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.logo} alt={settings.storeName} className="h-12 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,.6)]" />
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => go(l.href)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {table && (
              <span className="rounded-full border border-gold-400/40 bg-gold-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-gold-300" title="Você está fazendo o pedido para esta mesa">
                Mesa {table}
              </span>
            )}
            <button
              onClick={() => setCartOpen(true)}
              className="btn btn-gold relative h-11 px-4 text-sm"
              aria-label={`Carrinho, ${count} itens`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:inline">Carrinho</span>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-flame-500 px-1.5 text-xs font-black text-white ring-2 ring-ink-950"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button onClick={() => setOpen((v) => !v)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 md:hidden" aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed inset-x-0 top-16 z-30 border-b border-white/[0.06] bg-ink-950/95 p-4 backdrop-blur-xl md:hidden"
          >
            {LINKS.map((l, i) => (
              <motion.button
                key={l.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => go(l.href)}
                className="block w-full rounded-xl px-4 py-3.5 text-left font-display text-2xl tracking-wide text-white/90 active:bg-white/5"
              >
                {l.label.toUpperCase()}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
