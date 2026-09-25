"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, ExternalLink, Home, LogOut, Menu, Package, PizzaIcon, PlusCircle, Settings, Wallet, X } from "lucide-react";
import { Toggle, ToastProvider, api, useToast } from "./ui";
import type { AdminUser } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "Painel", Icon: Home, roles: ["admin"] },
  { href: "/admin/cardapio", label: "Cardápio", Icon: PizzaIcon, roles: ["admin"] },
  { href: "/admin/pedidos", label: "Pedidos", Icon: Package, roles: ["admin", "atendente"], badge: true },
  { href: "/admin/nova-venda", label: "Nova venda", Icon: PlusCircle, roles: ["admin", "atendente"] },
  { href: "/admin/vendas", label: "Vendas", Icon: Wallet, roles: ["admin", "atendente"] },
  { href: "/admin/relatorios", label: "Relatórios", Icon: BarChart3, roles: ["admin"] },
  { href: "/admin/configuracoes", label: "Configurações", Icon: Settings, roles: ["admin"] },
];

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.18].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.16);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
  } catch {}
}

export function AdminShell(props: { admin: AdminUser; logo: string; storeName: string; initialPending: number; initialOpen: boolean; children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Shell {...props} />
    </ToastProvider>
  );
}

function Shell({ admin, logo, storeName, initialPending, initialOpen, children }: Parameters<typeof AdminShell>[0]) {
  const path = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(initialPending);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [drawer, setDrawer] = useState(false);
  const last = useRef(initialPending);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await api<{ pending: number; isOpen: boolean }>("/api/admin/pending");
        if (r.pending > last.current) {
          beep();
          toast(`${r.pending - last.current} novo(s) pedido(s)!`);
          window.dispatchEvent(new Event("psp:new-order"));
        }
        last.current = r.pending;
        setPending(r.pending);
        setIsOpen(r.isOpen);
      } catch {}
    }, 12000);
    return () => clearInterval(t);
  }, [toast]);

  useEffect(() => {
    const on = (e: Event) => {
      const n = (e as CustomEvent<number>).detail;
      if (typeof n === "number") {
        last.current = n;
        setPending(n);
      }
    };
    window.addEventListener("psp:pending", on);
    return () => window.removeEventListener("psp:pending", on);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDrawer(false), [path]);

  const toggleStore = async (v: boolean) => {
    setIsOpen(v);
    try {
      await api("/api/admin/settings", { method: "PUT", body: { isOpen: v } });
      toast(v ? "Loja aberta — recebendo pedidos" : "Loja fechada");
      window.dispatchEvent(new CustomEvent("psp:store-open", { detail: v }));
    } catch (e) {
      setIsOpen(!v);
      toast(e instanceof Error ? e.message : "Erro", "error");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const nav = NAV.filter((n) => n.roles.includes(admin.role));
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-950 text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" className="h-12 w-auto" />
        <div className="min-w-0">
          <p className="truncate font-display text-lg leading-tight tracking-wide text-gold-300">{storeName.toUpperCase()}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Painel da loja</p>
        </div>
      </div>

      <div className="mx-4 mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">Loja</p>
          <p className={`text-sm font-extrabold ${isOpen ? "text-emerald-400" : "text-flame-400"}`}>{isOpen ? "Aberta" : "Fechada"}</p>
        </div>
        <Toggle checked={isOpen} onChange={toggleStore} label="Abrir ou fechar loja" />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ href, label, Icon, badge }) => {
          const on = isActive(href);
          return (
            <Link key={href} href={href} className={`relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-semibold transition ${on ? "text-ink-950" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>
              {on && <motion.span layoutId="nav" className="absolute inset-0 rounded-xl bg-gold-400" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
              <Icon className="relative h-5 w-5" />
              <span className="relative flex-1">{label}</span>
              {badge && pending > 0 && (
                <span className={`relative grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-black ${on ? "bg-ink-950 text-gold-300" : "bg-flame-500 text-white"}`}>{pending}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-4 w-4" /> Ver loja
        </a>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" /> Sair <span className="ml-auto truncate text-xs text-white/35">{admin.name}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-scope min-h-dvh bg-cream-50 text-ink-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-cream-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-cream-100" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
          {pending > 0 && <span className="absolute left-9 top-2.5 h-2.5 w-2.5 rounded-full bg-flame-500" />}
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={storeName} className="h-10" />
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${isOpen ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{isOpen ? "Aberta" : "Fechada"}</span>
      </header>

      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }} className="absolute inset-y-0 left-0 w-[280px]">
              <button onClick={() => setDrawer(false)} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white" aria-label="Fechar menu">
                <X className="h-4 w-4" />
              </button>
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="conteudo" className="px-4 py-6 sm:px-6 lg:ml-[264px] lg:px-10 lg:py-9">
        <motion.div key={path} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mx-auto max-w-[1400px]">
          {children}
        </motion.div>
      </main>
    </div>
  );
}
