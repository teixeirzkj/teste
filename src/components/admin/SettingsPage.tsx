"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Printer, QrCode, Save, Trash2 } from "lucide-react";
import { ImageUpload } from "./MenuManager";
import { Button, Card, Field, Modal, PageHeader, Skeleton, Toggle, api, compactCls, inputCls, useFetch, useToast } from "./ui";
import { centsToInput, parseMoney, slugify } from "@/lib/format";
import { buildOrderMessage } from "@/lib/whatsapp";
import { WEEKDAYS, type AdminUser, type Order, type Settings } from "@/lib/types";

type PrintLast = { ok: boolean; status?: number; error?: string; event: string; order?: number; at: string };
const EVENT_LABEL: Record<string, string> = { pedido_novo: "pedido do site", nova_venda: "nova venda", reimpressao: "reimpressão", teste: "teste" };

const SAMPLE: Order = {
  id: 0,
  number: 1234,
  customerName: "João Silva",
  phone: "(74) 99999-9999",
  deliveryType: "delivery",
  tableNumber: null,
  address: { street: "Rua Principal", number: "10", district: "Centro", complement: "Casa", reference: "Perto da praça", city: "Piritiba - BA" },
  payment: "Dinheiro",
  changeFor: 10000,
  subtotal: 5290,
  deliveryFee: 500,
  total: 5790,
  cost: 0,
  status: "pending",
  origin: "site",
  notes: "",
  createdAt: "",
  updatedAt: "",
  items: [{ id: 1, productId: 1, name: "Pizza Calabresa", category: "Pizzas", size: "Grande", qty: 1, unitPrice: 5290, addons: [], ingredients: ["Mussarela", "Calabresa", "Cebola", "Orégano"], flavors: [], notes: "", total: 5290 }],
};

export function SettingsPage({ me }: { me: AdminUser }) {
  const toast = useToast();
  const { data, loading, reload } = useFetch<{ settings: Settings; printLast: PrintLast | null }>("/api/admin/settings");
  const [testing, setTesting] = useState(false);
  const [s, setS] = useState<Settings | null>(null);
  const [fee, setFee] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setS(data.settings);
    setFee(centsToInput(data.settings.deliveryFee));
    setMinOrder(centsToInput(data.settings.minOrder));
  }, [data]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setS((cur) => (cur ? { ...cur, [k]: v } : cur));
    setDirty(true);
  };

  const preview = useMemo(() => (s ? buildOrderMessage(SAMPLE, s) : ""), [s]);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    try {
      const r = await api<{ settings: Settings }>("/api/admin/settings", {
        method: "PUT",
        body: { ...s, deliveryFee: parseMoney(fee), minOrder: parseMoney(minOrder) },
      });
      setS(r.settings);
      setDirty(false);
      toast("Configurações salvas — a loja já foi atualizada");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !s) return <Skeleton className="h-[70vh]" />;

  const text = (k: keyof Settings, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field label={label}>
      <input className={inputCls} value={String(s[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} {...props} />
    </Field>
  );

  return (
    <>
      <PageHeader title="Configurações" subtitle="Informações da loja exibidas no site e usadas nos pedidos." />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Loja aberta / fechada" className="xl:col-span-2">
          <div className="flex flex-wrap items-center gap-4">
            <Toggle checked={s.isOpen} onChange={(v) => set("isOpen", v)} label="Loja aberta" />
            <p className={`text-lg font-black ${s.isOpen ? "text-emerald-600" : "text-red-600"}`}>{s.isOpen ? "Aberta — recebendo pedidos pelo site" : "Fechada — o site não aceita pedidos"}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {text("openMessage", "Mensagem quando aberta")}
            {text("closedMessage", "Mensagem quando fechada")}
          </div>
        </Card>

        <Card title="Identidade">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-600">Logo</span>
              <ImageUpload kind="logo" value={s.logo} onChange={(v) => set("logo", v ?? "/logo.webp")} className="aspect-square bg-ink-950" />
            </div>
            <div className="space-y-3">
              {text("storeName", "Nome da pizzaria")}
              {text("tagline", "Frase do topo do site", { placeholder: "Feita para ser lembrada" })}
            </div>
          </div>
        </Card>

        <Card title="Imagens do site">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-600">Pizza da abertura</span>
              <ImageUpload kind="hero" value={s.heroImage} onChange={(v) => set("heroImage", v ?? "/img/hero-pizza.webp")} className="aspect-square bg-ink-950" />
              <p className="mt-1.5 text-xs text-ink-500">Use uma pizza inteira vista de cima, sobre fundo escuro. O recorte redondo é automático.</p>
              {s.heroImage !== "/img/hero-pizza.webp" && (
                <button onClick={() => set("heroImage", "/img/hero-pizza.webp")} className="mt-1 text-xs font-bold text-gold-700 hover:underline">
                  Voltar para a imagem padrão
                </button>
              )}
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-600">Foto do “Sobre nós”</span>
              <ImageUpload value={s.aboutImage} onChange={(v) => set("aboutImage", v ?? "/img/sobre.webp")} className="aspect-[4/3]" />
              {s.aboutImage !== "/img/sobre.webp" && (
                <button onClick={() => set("aboutImage", "/img/sobre.webp")} className="mt-1 text-xs font-bold text-gold-700 hover:underline">
                  Voltar para a imagem padrão
                </button>
              )}
            </div>
          </div>
        </Card>

        <Card title="Contato e redes sociais">
          <div className="grid gap-3 sm:grid-cols-2">
            {text("phone", "Telefone (exibido)", { inputMode: "tel" })}
            <Field label="WhatsApp que recebe pedidos" hint="Com DDD, só números. Ex.: 74999496531">
              <input className={inputCls} value={s.whatsapp} inputMode="tel" onChange={(e) => set("whatsapp", e.target.value.replace(/[^\d]/g, ""))} />
            </Field>
            {text("address", "Endereço")}
            {text("city", "Cidade")}
            {text("instagram", "Instagram", { placeholder: "@pizzariasaopaulo" })}
            {text("facebook", "Facebook")}
            {text("email", "E-mail", { type: "email" })}
          </div>
        </Card>

        <Card title="Funcionamento">
          <div className="space-y-3">
            {text("hoursText", "Horário (texto do site)", { placeholder: "Terça a domingo, das 18h às 23h" })}
            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-600">Dias de funcionamento</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d, i) => {
                  const on = s.days.includes(i);
                  return (
                    <button key={d} aria-pressed={on} onClick={() => set("days", on ? s.days.filter((x) => x !== i) : [...s.days, i].sort())} className={`h-10 w-14 rounded-xl text-sm font-bold transition ${on ? "bg-ink-950 text-white" : "bg-cream-100 text-ink-500"}`}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            {text("deliveryTime", "Tempo médio de entrega", { placeholder: "40–60 min" })}
          </div>
        </Card>

        <Card title="Entrega e valores">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Taxa de entrega (R$)">
              <input className={inputCls} inputMode="decimal" value={fee} onChange={(e) => (setFee(e.target.value), setDirty(true))} />
            </Field>
            <Field label="Pedido mínimo (R$)" hint="0 = sem mínimo">
              <input className={inputCls} inputMode="decimal" value={minOrder} onChange={(e) => (setMinOrder(e.target.value), setDirty(true))} />
            </Field>
            <Field label="Custo padrão (%)" hint="Para calcular o lucro">
              <input className={inputCls} inputMode="decimal" value={s.defaultCostPercent} onChange={(e) => set("defaultCostPercent", Math.min(100, Number(e.target.value.replace(",", ".")) || 0))} />
            </Field>
          </div>
        </Card>

        <Card title="Formas de pagamento">
          <ul className="space-y-2">
            {s.payments.map((p, i) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-cream-200 p-3">
                <input
                  className={`${inputCls} min-w-[160px] flex-1`}
                  value={p.name}
                  onChange={(e) => set("payments", s.payments.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))}
                  aria-label="Nome da forma de pagamento"
                />
                <label className="flex items-center gap-2 text-xs font-bold text-ink-600">
                  Troco
                  <Toggle checked={p.allowChange} onChange={(v) => set("payments", s.payments.map((x, k) => (k === i ? { ...x, allowChange: v } : x)))} label={`Pedir troco em ${p.name}`} />
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-ink-600">
                  Ativo
                  <Toggle checked={p.active} onChange={(v) => set("payments", s.payments.map((x, k) => (k === i ? { ...x, active: v } : x)))} label={`Ativar ${p.name}`} />
                </label>
                <button onClick={() => s.payments.length > 1 && set("payments", s.payments.filter((_, k) => k !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-red-600 hover:bg-red-50" aria-label={`Remover ${p.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => set("payments", [...s.payments, { id: `${slugify("novo")}-${Date.now().toString(36)}`, name: "Novo método", active: true, allowChange: false }])}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar método
          </Button>
        </Card>

        <Card title="Mesas (pedido pelo cardápio na mesa)">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-cream-200 p-3.5">
            <div>
              <p className="font-bold">Permitir pedido na mesa</p>
              <p className="text-xs text-ink-500">O cliente escolhe a opção “Mesa” e o número no checkout. O pedido vai direto para Pedidos e para a maquininha.</p>
            </div>
            <Toggle checked={s.tablesEnabled} onChange={(v) => set("tablesEnabled", v)} label="Permitir pedido na mesa" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr] sm:items-end">
            <Field label="Quantidade de mesas">
              <input
                className={inputCls}
                inputMode="numeric"
                value={s.tableCount}
                onChange={(e) => set("tableCount", Math.min(300, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))}
              />
            </Field>
            <a href="/admin/mesas" target="_blank" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cream-200 bg-white px-4 text-sm font-bold text-ink-800 hover:bg-cream-100">
              <QrCode className="h-4 w-4" /> Imprimir QR Codes das mesas
            </a>
          </div>
          <p className="mt-2 text-xs text-ink-500">Cada QR Code abre o cardápio já com a mesa escolhida. Salve antes de imprimir se mudou a quantidade.</p>
        </Card>

        <Card title="Impressão na maquininha">
          <p className="-mt-2 mb-3 text-xs text-ink-500">
            O sistema envia cada pedido (com o mesmo texto do WhatsApp) para o endereço abaixo, que a maquininha/impressora usa para imprimir. Funciona com o webhook do
            aplicativo da maquininha ou com uma automação (ex.: n8n).
          </p>
          <div className="space-y-3">
            <Field label="Endereço do webhook (https://)">
              <input className={inputCls} value={s.printWebhookUrl} onChange={(e) => set("printWebhookUrl", e.target.value.trim())} placeholder="https://…" inputMode="url" />
            </Field>
            <Field label="Token / chave (opcional)" hint="Vai no cabeçalho Authorization: Bearer e assina o envio (X-Pizzaria-Assinatura).">
              <input className={inputCls} type="password" autoComplete="off" value={s.printWebhookToken} onChange={(e) => set("printWebhookToken", e.target.value)} />
            </Field>
            <div className="space-y-2 rounded-2xl border border-cream-200 p-3.5">
              <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                Imprimir automaticamente pedidos do site
                <Toggle checked={s.printOnSiteOrder} onChange={(v) => set("printOnSiteOrder", v)} label="Imprimir pedidos do site" />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                Imprimir automaticamente ao registrar uma nova venda
                <Toggle checked={s.printOnNewSale} onChange={(v) => set("printOnNewSale", v)} label="Imprimir novas vendas" />
              </div>
              <p className="text-xs text-ink-500">Em Pedidos, o botão “Imprimir” reenvia qualquer pedido.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                disabled={testing || !s.printWebhookUrl}
                onClick={async () => {
                  if (dirty) return toast("Salve as configurações antes de testar.", "error");
                  setTesting(true);
                  try {
                    await api("/api/admin/print-test", { method: "POST" });
                    toast("Teste enviado — confira a maquininha");
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "Falha no teste", "error");
                  } finally {
                    setTesting(false);
                    reload();
                  }
                }}
              >
                <Printer className="h-4 w-4" /> {testing ? "Enviando…" : "Enviar teste"}
              </Button>
              {data?.printLast && (
                <span className={`text-xs font-semibold ${data.printLast.ok ? "text-emerald-700" : "text-red-600"}`}>
                  Último envio ({EVENT_LABEL[data.printLast.event] ?? data.printLast.event}
                  {data.printLast.order ? ` nº ${data.printLast.order}` : ""}, {new Date(data.printLast.at).toLocaleString("pt-BR")}):{" "}
                  {data.printLast.ok ? "recebido ✓" : data.printLast.error}
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card title="Mensagem do WhatsApp" className="xl:col-span-2">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <Field label="Cabeçalho" hint="Em branco = “🍕 NOVO PEDIDO — NOME DA PIZZARIA”. Use *texto* para negrito.">
                <input className={inputCls} value={s.whatsappHeader} onChange={(e) => set("whatsappHeader", e.target.value)} />
              </Field>
              <Field label="Rodapé">
                <textarea className={`${inputCls} resize-none`} rows={3} value={s.whatsappFooter} onChange={(e) => set("whatsappFooter", e.target.value)} />
              </Field>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-600">Pré-visualização</span>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#e7ddd3] p-4 font-sans text-[13px] leading-relaxed text-ink-900">
                <span className="block rounded-xl bg-[#d9fdd3] p-3 shadow-sm">{preview}</span>
              </pre>
            </div>
          </div>
        </Card>

        {me.role === "admin" && <UsersCard me={me} />}
        <PasswordCard />
        {me.role === "admin" && <DemoCard />}
      </div>

      <AnimatePresence>
        {dirty && (
          <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 lg:left-[264px]">
            <div className="flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl bg-ink-950 px-5 py-3 text-white shadow-2xl">
              <span className="text-sm font-semibold">Alterações não salvas</span>
              <Button variant="gold" onClick={save} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-24" />
    </>
  );
}

function UsersCard({ me }: { me: AdminUser }) {
  const toast = useToast();
  const { data, setData } = useFetch<{ users: AdminUser[] }>("/api/admin/users");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "atendente" as AdminUser["role"] });
  const [reset, setReset] = useState<AdminUser | null>(null);
  const [newPass, setNewPass] = useState("");

  const patch = async (u: AdminUser, body: Partial<AdminUser> & { password?: string }) => {
    try {
      const r = await api<{ user: AdminUser }>(`/api/admin/users/${u.id}`, { method: "PATCH", body });
      setData((d) => d && { users: d.users.map((x) => (x.id === u.id ? r.user : x)) });
      toast("Usuário atualizado");
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", "error");
      return false;
    }
  };

  const create = async () => {
    try {
      const r = await api<{ user: AdminUser }>("/api/admin/users", { body: form });
      setData((d) => d && { users: [...d.users, r.user] });
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "atendente" });
      toast("Usuário criado");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", "error");
    }
  };

  return (
    <Card
      title="Usuários do painel"
      action={
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Novo usuário
        </Button>
      }
    >
      <p className="-mt-2 mb-3 text-xs text-ink-500">
        <b>Administrador</b>: acesso total. <b>Atendente</b>: pedidos, nova venda e vendas.
      </p>
      <ul className="divide-y divide-cream-100">
        {data?.users.map((u) => (
          <li key={u.id} className={`flex flex-wrap items-center gap-3 py-3 ${u.active ? "" : "opacity-50"}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {u.name} {u.id === me.id && <span className="text-xs font-semibold text-ink-500">(você)</span>}
              </p>
              <p className="truncate text-xs text-ink-500">{u.email}</p>
            </div>
            <select className={`${compactCls} h-9`} value={u.role} onChange={(e) => patch(u, { role: e.target.value as AdminUser["role"] })} aria-label={`Perfil de ${u.name}`}>
              <option value="admin">Administrador</option>
              <option value="atendente">Atendente</option>
            </select>
            <Button size="sm" variant="ghost" onClick={() => setReset(u)}>
              Nova senha
            </Button>
            <Toggle checked={u.active} onChange={(v) => patch(u, { active: v })} label={`Ativar ${u.name}`} disabled={u.id === me.id} />
          </li>
        ))}
      </ul>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo usuário"
        footer={
          <Button variant="flame" onClick={create}>
            Criar usuário
          </Button>
        }
      >
        <div className="space-y-3">
          <Field label="Nome">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="E-mail">
            <input className={inputCls} type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Senha" hint="Mínimo de 8 caracteres.">
            <input className={inputCls} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Perfil">
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminUser["role"] })}>
              <option value="atendente">Atendente</option>
              <option value="admin">Administrador</option>
            </select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!reset}
        onClose={() => setReset(null)}
        title={`Nova senha · ${reset?.name ?? ""}`}
        footer={
          <Button
            variant="flame"
            onClick={async () => {
              if (reset && (await patch(reset, { password: newPass }))) {
                setReset(null);
                setNewPass("");
              }
            }}
          >
            Definir senha
          </Button>
        }
      >
        <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
          <input className={inputCls} type="password" autoComplete="new-password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
        </Field>
      </Modal>
    </Card>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Card title="Minha senha">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/api/admin/password", { body: { current, next } });
            toast("Senha alterada");
            setCurrent("");
            setNext("");
          } catch (err) {
            toast(err instanceof Error ? err.message : "Erro", "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Senha atual">
          <input className={inputCls} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label="Nova senha">
          <input className={inputCls} type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
        </Field>
        <Button type="submit" disabled={busy}>
          Alterar
        </Button>
      </form>
    </Card>
  );
}

function DemoCard() {
  const toast = useToast();
  const { data, setData } = useFetch<{ count: number }>("/api/admin/demo");
  if (!data?.count) return null;
  return (
    <Card title="Dados de demonstração">
      <p className="mb-3 text-sm text-ink-600">
        Existem <b>{data.count}</b> pedidos fictícios para você ver o painel funcionando. Remova antes de começar a usar de verdade.
      </p>
      <Button
        variant="danger"
        onClick={async () => {
          if (!confirm("Remover todos os pedidos de demonstração? Os relatórios vão zerar.")) return;
          try {
            const r = await api<{ removed: number }>("/api/admin/demo", { method: "DELETE" });
            setData({ count: 0 });
            toast(`${r.removed} pedidos de demonstração removidos`);
          } catch (e) {
            toast(e instanceof Error ? e.message : "Erro", "error");
          }
        }}
      >
        <Trash2 className="h-4 w-4" /> Remover pedidos de demonstração
      </Button>
    </Card>
  );
}
