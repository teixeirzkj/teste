"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { PERIOD_LABEL, type PeriodPreset } from "@/lib/time";

// ---------- API ----------
export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
    body: opts.body instanceof FormData ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Sessão expirada.");
  }
  if (!res.ok) throw new Error((data as { error?: string }).error || "Algo deu errado.");
  return data as T;
}

export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      setData(await api<T>(url));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  return { data, setData, error, loading, reload: load };
}

// ---------- Toast ----------
type ToastT = { id: number; msg: string; kind: "ok" | "error" };
const ToastCtx = createContext<(msg: string, kind?: "ok" | "error") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<ToastT[]>([]);
  const push = useCallback((msg: string, kind: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, msg, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-2 max-sm:left-4">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl ${
                t.kind === "ok" ? "bg-ink-900 text-white" : "bg-red-600 text-white"
              }`}
              role="status"
            >
              {t.kind === "ok" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4" />}
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- Layout ----------
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl leading-none tracking-wide text-ink-950 sm:text-5xl">{title.toUpperCase()}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return (
    <section className={`rounded-3xl border border-cream-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.08)] sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-ink-700">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50",
  primary: "bg-ink-950 text-white hover:bg-ink-800",
  gold: "bg-gold-400 text-ink-950 hover:bg-gold-300",
  flame: "bg-flame-500 text-white hover:bg-flame-600",
  ghost: "border border-cream-200 bg-white text-ink-800 hover:bg-cream-100",
  danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  md: "h-11 px-4 text-sm",
  sm: "h-9 px-3 text-xs",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "gold" | "flame" | "ghost" | "danger"; size?: "md" | "sm" }) {
  return <button {...props} className={`${btn.base} ${btn[variant]} ${btn[size]} ${className}`} />;
}

export const inputCls =
  "w-full rounded-xl border border-cream-200 bg-white px-3.5 py-2.5 text-[15px] text-ink-950 outline-none transition placeholder:text-ink-500/60 focus:border-gold-500 focus:ring-4 focus:ring-gold-400/20";

/** Campo compacto de largura automática (filtros, datas, selects em linha). */
export const compactCls =
  "rounded-xl border border-cream-200 bg-white px-3 text-sm font-semibold text-ink-800 outline-none transition focus:border-gold-500 focus:ring-4 focus:ring-gold-400/20";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? "bg-emerald-500" : "bg-ink-500/30"}`}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={`h-5 w-5 rounded-full bg-white shadow ${checked ? "ml-6" : "ml-1"}`} />
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal
            aria-label={title}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className={`relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
          >
            <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
              <h2 className="font-display text-2xl tracking-wide text-ink-950">{title.toUpperCase()}</h2>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream-100" aria-label="Fechar">
                <X className="h-5 w-5 text-ink-700" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5 text-ink-900">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-cream-200 bg-cream-50 px-5 py-3.5">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PeriodPicker({
  preset,
  from,
  to,
  onChange,
  presets = ["today", "7d", "30d", "month", "lastMonth", "custom"],
}: {
  preset: PeriodPreset;
  from: string;
  to: string;
  onChange: (p: { preset: PeriodPreset; from: string; to: string }) => void;
  presets?: PeriodPreset[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="no-scrollbar flex max-w-full overflow-x-auto rounded-xl border border-cream-200 bg-white p-1">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onChange({ preset: p, from, to })}
            className={`relative shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${preset === p ? "text-white" : "text-ink-600 hover:text-ink-950"}`}
          >
            {preset === p && <motion.span layoutId="period" className="absolute inset-0 rounded-lg bg-ink-950" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
            <span className="relative">{PERIOD_LABEL[p]}</span>
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex items-center gap-1.5 text-sm">
          <input type="date" value={from} max={to} onChange={(e) => onChange({ preset, from: e.target.value, to })} className={`${compactCls} h-10`} aria-label="Data inicial" />
          <span className="text-ink-500">até</span>
          <input type="date" value={to} min={from} onChange={(e) => onChange({ preset, from, to: e.target.value })} className={`${compactCls} h-10`} aria-label="Data final" />
        </div>
      )}
    </div>
  );
}

export function Stat({ label, value, sub, delta, icon, accent }: { label: string; value: string; sub?: string; delta?: number | null; icon?: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border p-5 ${accent ? "border-ink-900 bg-ink-950 text-white" : "border-cream-200 bg-white"}`}>
      {accent && <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-400/20 blur-2xl" />}
      <div className="relative flex items-start justify-between gap-2">
        <p className={`text-xs font-bold uppercase tracking-[0.12em] ${accent ? "text-gold-300" : "text-ink-500"}`}>{label}</p>
        {icon && <span className={`grid h-9 w-9 place-items-center rounded-xl ${accent ? "bg-gold-400/15 text-gold-300" : "bg-cream-100 text-ink-700"}`}>{icon}</span>}
      </div>
      <p className="relative mt-3 whitespace-nowrap text-[clamp(1.3rem,1.9vw,1.75rem)] font-black leading-none tracking-tight tabular-nums">{value}</p>
      <div className="relative mt-2 flex items-center gap-2 text-xs">
        {delta != null && Number.isFinite(delta) && (
          <span className={`rounded-md px-1.5 py-0.5 font-bold ${delta >= 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"} ${accent && delta >= 0 ? "text-emerald-300" : ""}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}%
          </span>
        )}
        {sub && <span className={accent ? "text-white/50" : "text-ink-500"}>{sub}</span>}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-cream-200 p-8 text-center text-sm text-ink-500">{children}</div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-cream-100 ${className}`} />;
}

export function pct(cur: number, prev: number): number | null {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}
