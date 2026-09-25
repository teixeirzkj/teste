"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button, Card, Empty, Field, Modal, PageHeader, Skeleton, Toggle, api, inputCls, useFetch, useToast } from "./ui";
import { centsToInput, minPrice, money, parseMoney } from "@/lib/format";
import type { Addon, Category, Product } from "@/lib/types";

type Data = { products: Product[]; categories: Category[] };

const DEFAULT_ADDONS: Addon[] = [
  { name: "Catupiry", price: 600 },
  { name: "Cheddar", price: 600 },
  { name: "Bacon", price: 700 },
  { name: "Calabresa", price: 600 },
  { name: "Queijo extra", price: 600 },
  { name: "Borda recheada de catupiry", price: 1000 },
  { name: "Borda recheada de cheddar", price: 1000 },
];
const PIZZA_SIZES = ["Pequena", "Média", "Grande", "Família"];

export function MenuManager() {
  const toast = useToast();
  const { data, setData, loading, reload } = useFetch<Data>("/api/admin/products");
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [cat, setCat] = useState<number | "all">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const catName = (id: number) => data?.categories.find((c) => c.id === id)?.name ?? "—";

  const patch = async (p: Product, flags: Partial<Pick<Product, "active" | "isPromo" | "isBest" | "isNew">>) => {
    setData((d) => d && { ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, ...flags } : x)) });
    try {
      await api(`/api/admin/products/${p.id}`, { method: "PATCH", body: flags });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", "error");
      reload();
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Excluir "${p.name}" do cardápio? Esta ação não pode ser desfeita.\n\nDica: para esconder temporariamente, apenas desative o produto.`)) return;
    try {
      await api(`/api/admin/products/${p.id}`, { method: "DELETE" });
      setData((d) => d && { ...d, products: d.products.filter((x) => x.id !== p.id) });
      toast("Produto excluído");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", "error");
    }
  };

  const moveProduct = async (p: Product, dir: -1 | 1) => {
    if (!data) return;
    const same = data.products.filter((x) => x.categoryId === p.categoryId).sort((a, b) => a.sort - b.sort);
    const i = same.findIndex((x) => x.id === p.id);
    const j = i + dir;
    if (j < 0 || j >= same.length) return;
    [same[i], same[j]] = [same[j], same[i]];
    const order = new Map(same.map((x, k) => [x.id, k]));
    setData({ ...data, products: data.products.map((x) => (order.has(x.id) ? { ...x, sort: order.get(x.id)! } : x)) });
    await api("/api/admin/reorder", { body: { table: "products", ids: same.map((x) => x.id) } }).catch(() => reload());
  };

  const groups = useMemo(() => {
    if (!data) return [];
    const t = q.trim().toLowerCase();
    return data.categories
      .filter((c) => cat === "all" || c.id === cat)
      .map((c) => ({
        c,
        items: data.products
          .filter((p) => p.categoryId === c.id && (!t || p.name.toLowerCase().includes(t)))
          .sort((a, b) => a.sort - b.sort),
      }))
      .filter((g) => g.items.length || (!t && cat !== "all"));
  }, [data, cat, q]);

  return (
    <>
      <PageHeader
        title="Cardápio"
        subtitle="Tudo que você alterar aqui aparece na loja na hora."
        actions={
          tab === "products" && (
            <Button variant="flame" onClick={() => setEditing("new")} disabled={!data?.categories.length}>
              <Plus className="h-4 w-4" /> Novo produto
            </Button>
          )
        }
      />

      <div className="mb-5 flex gap-1 rounded-2xl border border-cream-200 bg-white p-1 sm:w-fit">
        {(
          [
            ["products", "Produtos"],
            ["categories", "Categorias"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`relative flex-1 rounded-xl px-5 py-2 text-sm font-bold sm:flex-none ${tab === k ? "text-white" : "text-ink-600"}`}>
            {tab === k && <motion.span layoutId="menu-tab" className="absolute inset-0 rounded-xl bg-ink-950" />}
            <span className="relative">{l}</span>
          </button>
        ))}
      </div>

      {loading && !data ? (
        <Skeleton className="h-96" />
      ) : !data ? null : tab === "categories" ? (
        <CategoriesPanel data={data} setData={setData} reload={reload} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto" className={`${inputCls} pl-9`} aria-label="Buscar produto" />
            </label>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {[{ id: "all" as const, name: "Todas" }, ...data.categories].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${cat === c.id ? "bg-ink-950 text-white" : "bg-white text-ink-600 ring-1 ring-cream-200 hover:text-ink-950"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {groups.map(({ c, items }) => (
              <Card key={c.id} title={`${c.name} · ${items.length}`} action={!c.active && <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">Categoria oculta na loja</span>}>
                {!items.length ? (
                  <Empty>Nenhum produto nesta categoria.</Empty>
                ) : (
                  <ul className="divide-y divide-cream-100">
                    {items.map((p, i) => (
                      <li key={p.id} className={`flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap ${p.active ? "" : "opacity-55"}`}>
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                          {p.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <button onClick={() => setEditing(p)} className="min-w-[calc(100%-4.5rem)] flex-1 text-left sm:min-w-0">
                          <p className="truncate font-extrabold">{p.name}</p>
                          <p className="text-xs text-ink-500">
                            {p.sizes.length > 1 ? `${p.sizes.length} tamanhos · a partir de ` : ""}
                            <b className="text-ink-800">{money(minPrice(p.sizes))}</b>
                            {p.addons.length > 0 && ` · ${p.addons.length} adicionais`}
                          </p>
                        </button>
                        <div className="flex items-center gap-1.5 max-sm:ml-[4.25rem]">
                          <Flag on={p.isPromo} label="Promo" onClick={() => patch(p, { isPromo: !p.isPromo })} cls="bg-flame-500 text-white" />
                          <Flag on={p.isBest} label="Top" onClick={() => patch(p, { isBest: !p.isBest })} cls="bg-gold-400 text-ink-950" />
                          <Flag on={p.isNew} label="Novo" onClick={() => patch(p, { isNew: !p.isNew })} cls="bg-sky-500 text-white" />
                        </div>
                        <div className="flex items-center gap-1">
                          <Toggle checked={p.active} onChange={(v) => patch(p, { active: v })} label={`${p.active ? "Desativar" : "Ativar"} ${p.name}`} />
                          <IconBtn label="Subir" onClick={() => moveProduct(p, -1)} disabled={i === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn label="Descer" onClick={() => moveProduct(p, 1)} disabled={i === items.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn label="Editar" onClick={() => setEditing(p)}>
                            <Pencil className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn label="Excluir" onClick={() => remove(p)} danger>
                            <Trash2 className="h-4 w-4" />
                          </IconBtn>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
            {!groups.length && <Empty>Nenhum produto encontrado.</Empty>}
          </div>
        </>
      )}

      {data && editing && (
        <ProductForm
          key={editing === "new" ? "new" : editing.id}
          product={editing === "new" ? null : editing}
          categories={data.categories}
          defaultCategory={cat === "all" ? data.categories[0]?.id : cat}
          onClose={() => setEditing(null)}
          onSaved={(p) => {
            setData((d) => d && { ...d, products: d.products.some((x) => x.id === p.id) ? d.products.map((x) => (x.id === p.id ? p : x)) : [...d.products, p] });
            setEditing(null);
            toast(`"${p.name}" salvo — já está na loja`);
          }}
          catName={catName}
        />
      )}
    </>
  );
}

function Flag({ on, label, onClick, cls }: { on: boolean; label: string; onClick: () => void; cls: string }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`h-7 rounded-full px-2.5 text-[11px] font-black uppercase tracking-wide transition ${on ? cls : "bg-cream-100 text-ink-500 hover:text-ink-800"}`}>
      {label}
    </button>
  );
}

function IconBtn({ label, onClick, children, disabled, danger }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-lg transition disabled:opacity-25 ${danger ? "text-red-600 hover:bg-red-50" : "text-ink-600 hover:bg-cream-100 hover:text-ink-950"}`}
    >
      {children}
    </button>
  );
}

/**
 * Reduz fotos grandes (ex.: direto do celular) antes do envio: a Vercel limita
 * o tamanho da requisição. O servidor ainda valida e reprocessa a imagem.
 */
async function shrinkImage(file: File, max = 1800): Promise<File> {
  if (file.size < 1.5 * 1024 * 1024 || !file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    return blob ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function ImageUpload({ value, onChange, kind = "product", className = "" }: { value: string | null; onChange: (v: string | null) => void; kind?: "product" | "logo"; className?: string }) {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const send = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", await shrinkImage(file));
      fd.append("kind", kind);
      const r = await api<{ url: string }>("/api/admin/upload", { body: fd });
      onChange(r.url);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro no envio", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        send(e.dataTransfer.files?.[0]);
      }}
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition ${drag ? "border-gold-500 bg-gold-100" : "border-cream-200 bg-cream-50"} ${className}`}
    >
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Pré-visualização" className={`h-full w-full ${kind === "logo" ? "object-contain p-3" : "object-cover"}`} />
      ) : (
        <div className="grid h-full place-items-center p-4 text-center text-sm text-ink-500">
          <div>
            <ImagePlus className="mx-auto mb-2 h-8 w-8 text-ink-500/60" />
            Arraste uma imagem ou clique para enviar
            <span className="mt-1 block text-xs">JPG, PNG ou WebP</span>
          </div>
        </div>
      )}
      <button type="button" onClick={() => ref.current?.click()} className="absolute inset-0" aria-label="Enviar imagem" />
      <div className="absolute bottom-2 right-2 flex gap-1.5">
        {value && (
          <button type="button" onClick={() => onChange(null)} className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-600 shadow" aria-label="Remover imagem">
            <X className="h-4 w-4" />
          </button>
        )}
        <span className="pointer-events-none rounded-full bg-ink-950/85 px-3 py-1.5 text-xs font-bold text-white">{busy ? "Enviando…" : value ? "Trocar imagem" : "Enviar"}</span>
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => send(e.target.files?.[0] ?? undefined)} />
    </div>
  );
}

type SizeRow = { name: string; price: string; oldPrice: string };
type AddonRow = { name: string; price: string };

function ProductForm({
  product,
  categories,
  defaultCategory,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  defaultCategory?: number;
  onClose: () => void;
  onSaved: (p: Product) => void;
  catName: (id: number) => string;
}) {
  const toast = useToast();
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? defaultCategory ?? categories[0]?.id);
  const [description, setDescription] = useState(product?.description ?? "");
  const [ingredients, setIngredients] = useState<string[]>(product?.ingredients ?? []);
  const [ingInput, setIngInput] = useState("");
  const [image, setImage] = useState<string | null>(product?.image ?? null);
  const [sizes, setSizes] = useState<SizeRow[]>(
    product?.sizes.map((s) => ({ name: s.name, price: centsToInput(s.price), oldPrice: centsToInput(s.oldPrice ?? null) })) ?? [{ name: "Único", price: "", oldPrice: "" }]
  );
  const [addons, setAddons] = useState<AddonRow[]>(product?.addons.map((a) => ({ name: a.name, price: centsToInput(a.price) })) ?? []);
  const [cost, setCost] = useState(product?.costPercent != null ? String(product.costPercent) : "");
  const [flags, setFlags] = useState({ active: product?.active ?? true, isPromo: product?.isPromo ?? false, isBest: product?.isBest ?? false, isNew: product?.isNew ?? false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const multi = sizes.length > 1 || (sizes[0] && sizes[0].name !== "Único");

  const addIngredient = () => {
    const parts = ingInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) setIngredients((cur) => [...cur, ...parts.filter((p) => !cur.includes(p))]);
    setIngInput("");
  };

  const save = async () => {
    setError(null);
    const body = {
      categoryId,
      name: name.trim(),
      description: description.trim(),
      ingredients,
      image,
      sizes: sizes.map((s) => ({ name: s.name.trim() || "Único", price: parseMoney(s.price), oldPrice: s.oldPrice ? parseMoney(s.oldPrice) : null })),
      addons: addons.filter((a) => a.name.trim()).map((a) => ({ name: a.name.trim(), price: parseMoney(a.price) })),
      costPercent: cost.trim() ? Number(cost.replace(",", ".")) : null,
      ...flags,
    };
    if (!body.name) return setError("Informe o nome do produto.");
    if (body.sizes.some((s) => s.price <= 0)) return setError("Informe o preço de todos os tamanhos.");
    setSaving(true);
    try {
      const r = product
        ? await api<{ product: Product }>(`/api/admin/products/${product.id}`, { method: "PUT", body })
        : await api<{ product: Product }>("/api/admin/products", { body });
      onSaved(r.product);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
      toast("Não foi possível salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const small = "text-[11px] font-bold uppercase tracking-wider text-ink-500";

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={product ? `Editar ${product.name}` : "Novo produto"}
      footer={
        <>
          {error && (
            <p className="mr-auto self-center text-sm font-semibold text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="flame" onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar produto"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <div className="space-y-3">
          <ImageUpload value={image} onChange={setImage} className="aspect-[4/3] md:aspect-square" />
          <div className="space-y-2.5 rounded-2xl border border-cream-200 p-3.5">
            {(
              [
                ["active", "Ativo na loja"],
                ["isPromo", "Promoção"],
                ["isBest", "Mais pedida"],
                ["isNew", "Novidade"],
              ] as const
            ).map(([k, l]) => (
              <div key={k} className="flex items-center justify-between text-sm font-semibold">
                {l}
                <Toggle checked={flags[k]} onChange={(v) => setFlags((f) => ({ ...f, [k]: v }))} label={l} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <Field label="Nome">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Calabresa" />
            </Field>
            <Field label="Categoria">
              <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Descrição curta">
            <textarea className={`${inputCls} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} />
          </Field>

          <Field label="Ingredientes" hint="Digite e aperte Enter (ou separe por vírgula).">
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-cream-200 p-2 focus-within:border-gold-500">
              {ingredients.map((ing) => (
                <span key={ing} className="inline-flex items-center gap-1 rounded-full bg-cream-100 py-1 pl-3 pr-1 text-sm font-semibold">
                  {ing}
                  <button type="button" onClick={() => setIngredients((c) => c.filter((x) => x !== ing))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-cream-200" aria-label={`Remover ${ing}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                className="min-w-[140px] flex-1 bg-transparent px-1.5 py-1 text-[15px] outline-none"
                value={ingInput}
                onChange={(e) => setIngInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addIngredient();
                  } else if (e.key === "Backspace" && !ingInput) setIngredients((c) => c.slice(0, -1));
                }}
                onBlur={addIngredient}
                placeholder="Mussarela, tomate…"
              />
            </div>
          </Field>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-600">Preços</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant={multi ? "ghost" : "primary"} onClick={() => setSizes([{ name: "Único", price: sizes[0]?.price ?? "", oldPrice: "" }])}>
                  Preço único
                </Button>
                <Button size="sm" variant={multi ? "primary" : "ghost"} onClick={() => !multi && setSizes(PIZZA_SIZES.map((n) => ({ name: n, price: "", oldPrice: "" })))}>
                  Por tamanho
                </Button>
              </div>
            </div>
            <div className="space-y-2 rounded-2xl border border-cream-200 p-3">
              <div className={`grid gap-2 ${small} ${multi ? "grid-cols-[1fr_100px_100px_36px]" : "grid-cols-[100px_100px]"}`}>
                {multi && <span>Tamanho</span>}
                <span>Preço (R$)</span>
                <span title="Aparece riscado na loja">De (riscado)</span>
              </div>
              {sizes.map((s, i) => (
                <div key={i} className={`grid items-center gap-2 ${multi ? "grid-cols-[1fr_100px_100px_36px]" : "grid-cols-[100px_100px]"}`}>
                  {multi && <input className={inputCls} value={s.name} onChange={(e) => setSizes((c) => c.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} aria-label="Nome do tamanho" />}
                  <input className={inputCls} inputMode="decimal" placeholder="0,00" value={s.price} onChange={(e) => setSizes((c) => c.map((x, k) => (k === i ? { ...x, price: e.target.value } : x)))} aria-label="Preço" />
                  <input className={inputCls} inputMode="decimal" placeholder="—" value={s.oldPrice} onChange={(e) => setSizes((c) => c.map((x, k) => (k === i ? { ...x, oldPrice: e.target.value } : x)))} aria-label="Preço antigo" />
                  {multi && (
                    <IconBtn label="Remover tamanho" onClick={() => setSizes((c) => (c.length > 1 ? c.filter((_, k) => k !== i) : c))} danger>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  )}
                </div>
              ))}
              {multi && (
                <Button size="sm" variant="ghost" onClick={() => setSizes((c) => [...c, { name: "", price: "", oldPrice: "" }])}>
                  <Plus className="h-3.5 w-3.5" /> Tamanho
                </Button>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-600">Adicionais</span>
              <Button size="sm" variant="ghost" onClick={() => setAddons(DEFAULT_ADDONS.map((a) => ({ name: a.name, price: centsToInput(a.price) })))}>
                Usar adicionais padrão
              </Button>
            </div>
            <div className="space-y-2 rounded-2xl border border-cream-200 p-3">
              <AnimatePresence initial={false}>
                {addons.map((a, i) => (
                  <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-[1fr_100px_36px] items-center gap-2">
                    <input className={inputCls} value={a.name} placeholder="Ex.: Bacon" onChange={(e) => setAddons((c) => c.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} aria-label="Nome do adicional" />
                    <input className={inputCls} inputMode="decimal" placeholder="0,00" value={a.price} onChange={(e) => setAddons((c) => c.map((x, k) => (k === i ? { ...x, price: e.target.value } : x)))} aria-label="Preço do adicional" />
                    <IconBtn label="Remover adicional" onClick={() => setAddons((c) => c.filter((_, k) => k !== i))} danger>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!addons.length && <p className="text-sm text-ink-500">Sem adicionais.</p>}
              <Button size="sm" variant="ghost" onClick={() => setAddons((c) => [...c, { name: "", price: "" }])}>
                <Plus className="h-3.5 w-3.5" /> Adicional
              </Button>
            </div>
          </div>

          <Field label="Custo estimado (%)" hint="Usado para calcular o lucro. Em branco = custo padrão das configurações." className="sm:w-64">
            <input className={inputCls} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^\d,.]/g, ""))} placeholder="Ex.: 45" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function CategoriesPanel({ data, setData, reload }: { data: Data; setData: (fn: (d: Data | null) => Data | null) => void; reload: () => void }) {
  const toast = useToast();
  const [newName, setNewName] = useState("");
  const [edit, setEdit] = useState<{ id: number; name: string } | null>(null);
  const cats = [...data.categories].sort((a, b) => a.sort - b.sort);
  const count = (id: number) => data.products.filter((p) => p.categoryId === id).length;

  const save = async (c: Category, patch: Partial<Category>) => {
    const next = { ...c, ...patch };
    setData((d) => d && { ...d, categories: d.categories.map((x) => (x.id === c.id ? next : x)) });
    try {
      await api(`/api/admin/categories/${c.id}`, { method: "PUT", body: { name: next.name, image: next.image, active: next.active } });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", "error");
      reload();
    }
  };

  const create = async () => {
    if (!newName.trim()) return;
    try {
      const r = await api<{ category: Category }>("/api/admin/categories", { body: { name: newName.trim(), active: true } });
      setData((d) => d && { ...d, categories: [...d.categories, r.category] });
      setNewName("");
      toast("Categoria criada");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", "error");
    }
  };

  const del = async (c: Category) => {
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return;
    try {
      await api(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      setData((d) => d && { ...d, categories: d.categories.filter((x) => x.id !== c.id) });
      toast("Categoria excluída");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", "error");
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cats.length) return;
    const list = [...cats];
    [list[i], list[j]] = [list[j], list[i]];
    const order = new Map(list.map((c, k) => [c.id, k]));
    setData((d) => d && { ...d, categories: d.categories.map((c) => ({ ...c, sort: order.get(c.id) ?? c.sort })) });
    await api("/api/admin/reorder", { body: { table: "categories", ids: list.map((c) => c.id) } }).catch(() => reload());
  };

  return (
    <Card title="Categorias do cardápio">
      <p className="-mt-2 mb-4 text-sm text-ink-500">A ordem aqui é a mesma da barra de categorias na loja. Categorias desativadas somem da loja junto com seus produtos.</p>
      <ul className="divide-y divide-cream-100">
        {cats.map((c, i) => (
          <li key={c.id} className="flex items-center gap-3 py-3">
            <span className="w-6 text-center text-sm font-black text-ink-500">{i + 1}</span>
            {edit?.id === c.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (edit.name.trim()) save(c, { name: edit.name.trim() });
                  setEdit(null);
                }}
              >
                <input autoFocus className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} aria-label="Nome da categoria" />
                <Button type="submit">Salvar</Button>
              </form>
            ) : (
              <button onClick={() => setEdit({ id: c.id, name: c.name })} className={`min-w-0 flex-1 text-left ${c.active ? "" : "opacity-50"}`}>
                <p className="truncate font-extrabold">{c.name}</p>
                <p className="text-xs text-ink-500">{count(c.id)} produto(s)</p>
              </button>
            )}
            <Toggle checked={c.active} onChange={(v) => save(c, { active: v })} label={`Ativar ${c.name}`} />
            <IconBtn label="Subir" onClick={() => move(i, -1)} disabled={i === 0}>
              <ArrowUp className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Descer" onClick={() => move(i, 1)} disabled={i === cats.length - 1}>
              <ArrowDown className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Renomear" onClick={() => setEdit({ id: c.id, name: c.name })}>
              <Pencil className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Excluir" onClick={() => del(c)} danger>
              <Trash2 className="h-4 w-4" />
            </IconBtn>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nova categoria (ex.: Esfihas)" aria-label="Nova categoria" />
        <Button type="submit" variant="flame" disabled={!newName.trim()}>
          <Plus className="h-4 w-4" /> Criar
        </Button>
      </form>
    </Card>
  );
}
