"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";

export function LoginForm({ logo, storeName, showDefault }: { logo: string; storeName: string; showDefault: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível entrar.");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
      setLoading(false);
    }
  };

  return (
    <div className="grain relative grid min-h-dvh place-items-center overflow-hidden bg-ink-950 px-4 py-10">
      <div className="absolute left-1/2 top-1/3 h-[60vmin] w-[60vmin] -translate-x-1/2 rounded-full bg-gold-500/15 blur-[120px]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/hero-pizza.webp" alt="" className="absolute -bottom-[30vmin] -right-[20vmin] w-[80vmin] animate-spin-slow opacity-20" />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm rounded-[28px] border border-white/10 bg-ink-900/80 p-7 shadow-2xl backdrop-blur-xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={storeName} className="mx-auto -mt-20 w-40 drop-shadow-[0_20px_30px_rgba(0,0,0,.6)]" />
        <h1 className="mt-3 text-center font-display text-3xl tracking-wide">PAINEL DA LOJA</h1>
        <p className="mt-1 text-center text-sm text-white/50">Entre para gerenciar pedidos e cardápio</p>

        <label className="mt-7 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/50">E-mail</span>
          <input className="field" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/50">Senha</span>
          <span className="relative block">
            <input className="field pr-12" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-white/50 hover:text-white" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>
        {error && (
          <p className="mt-4 rounded-xl border border-flame-500/30 bg-flame-500/10 px-3 py-2 text-sm font-semibold text-flame-400" role="alert">
            {error}
          </p>
        )}
        <button disabled={loading} className="btn btn-gold mt-6 h-12 w-full">
          <Lock className="h-4 w-4" /> {loading ? "Entrando…" : "Entrar"}
        </button>
        {showDefault && (
          <p className="mt-5 rounded-xl bg-white/5 p-3 text-center text-xs leading-relaxed text-white/45">
            Acesso inicial (desenvolvimento): <b className="text-white/70">admin@pizzariasaopaulo.com.br</b> / <b className="text-white/70">saopaulo2026</b>
            <br />
            Troque a senha em Configurações.
          </p>
        )}
      </motion.form>
    </div>
  );
}
