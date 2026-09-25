import "server-only";
import fs from "node:fs";
import path from "node:path";
import { ensureSeed } from "./seed";

/**
 * Banco Postgres.
 * - Produção (Vercel): Supabase via DATABASE_URL (use a URL do "Transaction pooler", porta 6543).
 * - Desenvolvimento sem DATABASE_URL: Postgres embutido (PGlite) salvo em ./data/pg.
 *
 * Toda query usa parâmetros ($1, $2…) — nunca concatene entrada do usuário no SQL.
 */

export type Row = Record<string, unknown>;
export type Param = string | number | boolean | null | Uint8Array;

export interface Db {
  query<T extends Row = Row>(text: string, params?: Param[]): Promise<T[]>;
  exec(text: string): Promise<void>;
  tx<T>(fn: (q: Db) => Promise<T>): Promise<T>;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  ingredients JSONB NOT NULL DEFAULT '[]',
  image TEXT,
  sizes JSONB NOT NULL DEFAULT '[]',
  addons JSONB NOT NULL DEFAULT '[]',
  cost_percent REAL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  is_promo BOOLEAN NOT NULL DEFAULT FALSE,
  is_best BOOLEAN NOT NULL DEFAULT FALSE,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL,
  address JSONB NOT NULL DEFAULT '{}',
  payment TEXT NOT NULL,
  change_for INTEGER,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  origin TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  qty INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  addons JSONB NOT NULL DEFAULT '[]',
  ingredients JSONB NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  total INTEGER NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS uploads (
  name TEXT PRIMARY KEY,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Supabase expõe o schema public pela API REST: RLS ligado e SEM políticas
-- bloqueia acesso pela chave anon/authenticated. O servidor usa a conexão direta (dono das tabelas).
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
`;

async function createPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  // prepare:false é exigido pelo pooler em modo transação do Supabase.
  const sql = postgres(url, { prepare: false, max: Number(process.env.DB_POOL_MAX) || 5, idle_timeout: 20, connect_timeout: 15, onnotice: () => {} });
  type Runner = { unsafe: (text: string, params?: never[]) => PromiseLike<unknown> };
  const wrap = (s: Runner): Db => ({
    query: async <T extends Row>(text: string, params: Param[] = []) => (await s.unsafe(text, params as never[])) as T[],
    exec: async (text: string) => {
      await s.unsafe(text);
    },
    tx: async <T,>(fn: (q: Db) => Promise<T>) => (await sql.begin((t) => fn(wrap(t as unknown as Runner)))) as T,
  });
  return wrap(sql as unknown as Runner);
}

async function createPglite(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "pg");
  fs.mkdirSync(dir, { recursive: true });
  const pg = new PGlite(dir);
  await pg.waitReady;
  type Q = { query: (t: string, p?: unknown[]) => Promise<{ rows: unknown[] }>; exec: (t: string) => Promise<unknown> };
  const wrap = (s: Q, root: boolean): Db => ({
    query: async <T extends Row>(text: string, params: Param[] = []) => (await s.query(text, params)).rows as T[],
    exec: async (text: string) => {
      await s.exec(text);
    },
    tx: async <T,>(fn: (q: Db) => Promise<T>) => (root ? pg.transaction((t) => fn(wrap(t as unknown as Q, false))) : fn(wrap(s, false))) as Promise<T>,
  });
  return wrap(pg as unknown as Q, true);
}

declare global {
  var __pspDb: Promise<Db> | undefined;
}

/** Aceita a URL manual (DATABASE_URL) ou a criada pela integração Vercel ↔ Supabase (POSTGRES_URL). */
function databaseUrl(): string | null {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!raw) return null;
  const u = new URL(raw);
  // Remove parâmetros extras que a integração adiciona e o driver repassaria ao servidor.
  for (const k of [...u.searchParams.keys()]) if (k !== "sslmode") u.searchParams.delete(k);
  const local = ["localhost", "127.0.0.1"].includes(u.hostname);
  if (!local && !u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
  return u.toString();
}

async function init(): Promise<Db> {
  const url = databaseUrl();
  if (!url && process.env.VERCEL) throw new Error("DATABASE_URL não configurada na Vercel.");
  const d = url ? await createPostgres(url) : await createPglite();
  await d.exec(SCHEMA);
  await ensureSeed(d);
  return d;
}

export function db(): Promise<Db> {
  if (!globalThis.__pspDb) {
    globalThis.__pspDb = init().catch((e) => {
      globalThis.__pspDb = undefined;
      throw e;
    });
  }
  return globalThis.__pspDb;
}

/** Atalho: executa uma query na conexão padrão. */
export async function q<T extends Row = Row>(text: string, params?: Param[]): Promise<T[]> {
  return (await db()).query<T>(text, params);
}

export async function tx<T>(fn: (q: Db) => Promise<T>): Promise<T> {
  return (await db()).tx(fn);
}

export function json<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v !== "string") return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function iso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString();
}

export const nowISO = () => new Date().toISOString();
