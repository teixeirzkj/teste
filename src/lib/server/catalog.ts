import "server-only";
import { json, q, tx, type Row } from "./db";
import { DEFAULT_SETTINGS } from "./seed";
import type { Addon, Category, Product, Settings, Size } from "../types";

export function rowToCategory(r: Row): Category {
  return {
    id: Number(r.id),
    name: String(r.name),
    image: (r.image as string) ?? null,
    sort: Number(r.sort),
    active: !!r.active,
  };
}

export function rowToProduct(r: Row): Product {
  return {
    id: Number(r.id),
    categoryId: Number(r.category_id),
    name: String(r.name),
    description: String(r.description ?? ""),
    ingredients: json<string[]>(r.ingredients, []),
    image: (r.image as string) ?? null,
    sizes: json<Size[]>(r.sizes, []),
    addons: json<Addon[]>(r.addons, []),
    costPercent: r.cost_percent == null ? null : Number(r.cost_percent),
    active: !!r.active,
    isPromo: !!r.is_promo,
    isBest: !!r.is_best,
    isNew: !!r.is_new,
    sort: Number(r.sort),
  };
}

export async function getSettings(): Promise<Settings> {
  const [row] = await q("SELECT data FROM settings WHERE id = 1");
  return { ...DEFAULT_SETTINGS, ...json<Partial<Settings>>(row?.data, {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await q("INSERT INTO settings (id, data) VALUES (1, $1::text::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data", [JSON.stringify(next)]);
  return next;
}

export async function listCategories(onlyActive = false): Promise<Category[]> {
  const rows = await q(`SELECT * FROM categories ${onlyActive ? "WHERE active" : ""} ORDER BY sort, id`);
  return rows.map(rowToCategory);
}

export async function listProducts(onlyActive = false): Promise<Product[]> {
  const rows = await q(
    onlyActive
      ? "SELECT p.* FROM products p JOIN categories c ON c.id = p.category_id WHERE p.active AND c.active ORDER BY p.sort, p.id"
      : "SELECT * FROM products ORDER BY sort, id"
  );
  return rows.map(rowToProduct);
}

export async function getProduct(id: number): Promise<Product | null> {
  const [r] = await q("SELECT * FROM products WHERE id = $1", [id]);
  return r ? rowToProduct(r) : null;
}

/** Dados públicos da loja (somente itens ativos). */
export async function getStorefront() {
  const [settings, categories, products] = await Promise.all([getSettings(), listCategories(true), listProducts(true)]);
  return { settings, categories, products };
}

export type ProductInput = Omit<Product, "id" | "sort"> & { sort?: number };

const productParams = (p: ProductInput) => [
  p.categoryId,
  p.name,
  p.description,
  JSON.stringify(p.ingredients),
  p.image,
  JSON.stringify(p.sizes),
  JSON.stringify(p.addons),
  p.costPercent,
  p.active,
  p.isPromo,
  p.isBest,
  p.isNew,
];

export async function createProduct(p: ProductInput): Promise<Product> {
  const [r] = await q(
    `INSERT INTO products (category_id, name, description, ingredients, image, sizes, addons, cost_percent, active, is_promo, is_best, is_new, sort)
     VALUES ($1, $2, $3, $4::text::jsonb, $5, $6::text::jsonb, $7::text::jsonb, $8, $9, $10, $11, $12,
       COALESCE($13, (SELECT COALESCE(MAX(sort), -1) + 1 FROM products WHERE category_id = $1)))
     RETURNING *`,
    [...productParams(p), p.sort ?? null]
  );
  return rowToProduct(r);
}

export async function updateProduct(id: number, p: ProductInput): Promise<Product | null> {
  const [r] = await q(
    `UPDATE products SET category_id = $1, name = $2, description = $3, ingredients = $4::text::jsonb, image = $5, sizes = $6::text::jsonb,
       addons = $7::text::jsonb, cost_percent = $8, active = $9, is_promo = $10, is_best = $11, is_new = $12, updated_at = NOW()
     WHERE id = $13 RETURNING *`,
    [...productParams(p), id]
  );
  return r ? rowToProduct(r) : null;
}

const FLAG_COLS: Record<string, string> = { active: "active", isPromo: "is_promo", isBest: "is_best", isNew: "is_new" };

export async function patchProductFlags(id: number, flags: Partial<Pick<Product, "active" | "isPromo" | "isBest" | "isNew">>) {
  for (const [k, v] of Object.entries(flags)) {
    if (!(k in FLAG_COLS) || typeof v !== "boolean") continue;
    // O nome da coluna vem de uma lista fixa (nunca da requisição).
    await q(`UPDATE products SET ${FLAG_COLS[k]} = $1, updated_at = NOW() WHERE id = $2`, [v, id]);
  }
  return getProduct(id);
}

export async function deleteProduct(id: number) {
  await q("DELETE FROM products WHERE id = $1", [id]);
}

export async function reorder(table: "products" | "categories", ids: number[]) {
  const t = table === "products" ? "products" : "categories";
  await tx(async (d) => {
    for (const [i, id] of ids.entries()) await d.query(`UPDATE ${t} SET sort = $1 WHERE id = $2`, [i, id]);
  });
}

export async function createCategory(c: { name: string; image: string | null; active: boolean }): Promise<Category> {
  const [r] = await q(
    "INSERT INTO categories (name, image, sort, active) VALUES ($1, $2, (SELECT COALESCE(MAX(sort), -1) + 1 FROM categories), $3) RETURNING *",
    [c.name, c.image, c.active]
  );
  return rowToCategory(r);
}

export async function updateCategory(id: number, c: { name: string; image: string | null; active: boolean }) {
  const [r] = await q("UPDATE categories SET name = $1, image = $2, active = $3 WHERE id = $4 RETURNING *", [c.name, c.image, c.active, id]);
  return r ? rowToCategory(r) : null;
}

export async function deleteCategory(id: number): Promise<{ ok: boolean; error?: string }> {
  const [{ n }] = await q<{ n: number }>("SELECT COUNT(*)::int AS n FROM products WHERE category_id = $1", [id]);
  if (n > 0) return { ok: false, error: `Esta categoria tem ${n} produto(s). Mova ou exclua os produtos antes.` };
  await q("DELETE FROM categories WHERE id = $1", [id]);
  return { ok: true };
}
