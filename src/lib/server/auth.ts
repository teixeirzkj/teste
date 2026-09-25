import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { q, type Row } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { rateLimitHit, rateLimitReset, rateLimitStatus } from "./ratelimit";
import type { AdminRole, AdminUser } from "../types";

export const SESSION_COOKIE = "psp_session";
const SESSION_DAYS = 7;

let cachedSecret: string | null = null;
async function secret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) {
    cachedSecret = process.env.SESSION_SECRET;
    return cachedSecret;
  }
  // Sem variável de ambiente: gera um segredo aleatório uma única vez e guarda no banco (nunca no código).
  await q("INSERT INTO meta (key, value) VALUES ('session_secret', $1) ON CONFLICT (key) DO NOTHING", [randomBytes(48).toString("hex")]);
  const [r] = await q<{ value: string }>("SELECT value FROM meta WHERE key = 'session_secret'");
  cachedSecret = r.value;
  return cachedSecret;
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = async (data: string) => createHmac("sha256", await secret()).update(data).digest("base64url");

export async function createSessionToken(uid: number): Promise<string> {
  const payload = b64(JSON.stringify({ uid, exp: Date.now() + SESSION_DAYS * 86400000, n: randomBytes(8).toString("hex") }));
  return `${payload}.${await sign(payload)}`;
}

async function verifyToken(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(await sign(payload));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { uid: number; exp: number };
    if (typeof data.uid !== "number" || data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}

function rowToAdmin(r: Row): AdminUser {
  return { id: Number(r.id), name: String(r.name), email: String(r.email), role: r.role as AdminRole, active: !!r.active };
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const jar = await cookies();
  const uid = await verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const [r] = await q("SELECT * FROM admins WHERE id = $1 AND active", [uid]);
  return r ? rowToAdmin(r) : null;
}

export class AuthError extends Error {
  constructor(public status: 401 | 403) {
    super(status === 401 ? "Faça login para continuar." : "Você não tem permissão para esta ação.");
  }
}

/** Use em TODA rota administrativa. */
export async function requireAdmin(roles: AdminRole[] = ["admin", "atendente"]): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new AuthError(401);
  if (!roles.includes(admin.role)) throw new AuthError(403);
  return admin;
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 86400,
};

// ---- Limite de tentativas de login (no banco, vale para todas as instâncias) ----
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

/** Minutos restantes de bloqueio, ou 0 se liberado. */
export async function loginBlocked(key: string): Promise<number> {
  const s = await rateLimitStatus(`login:${key}`);
  return s && s.count >= MAX_ATTEMPTS ? Math.ceil(s.msLeft / 60000) : 0;
}

export async function registerFailure(key: string) {
  await rateLimitHit(`login:${key}`, WINDOW_MS);
}

export async function clearFailures(key: string) {
  await rateLimitReset(`login:${key}`);
}

let dummyHash: string | null = null;

export async function authenticate(email: string, password: string): Promise<AdminUser | null> {
  const [r] = await q("SELECT * FROM admins WHERE lower(email) = lower($1) AND active", [email.trim()]);
  // Executa o hash mesmo sem usuário para não revelar e-mails existentes pelo tempo de resposta.
  dummyHash ??= hashPassword(randomBytes(12).toString("hex"));
  const ok = verifyPassword(password, r ? String(r.password_hash) : dummyHash);
  return r && ok ? rowToAdmin(r) : null;
}

// ---- Usuários ----
export async function listAdmins(): Promise<AdminUser[]> {
  return (await q("SELECT * FROM admins ORDER BY id")).map(rowToAdmin);
}

export async function createAdmin(u: { name: string; email: string; password: string; role: AdminRole }): Promise<AdminUser> {
  const [r] = await q("INSERT INTO admins (name, email, password_hash, role, active) VALUES ($1, $2, $3, $4, TRUE) RETURNING *", [
    u.name,
    u.email.trim().toLowerCase(),
    hashPassword(u.password),
    u.role,
  ]);
  return rowToAdmin(r);
}

export async function updateAdmin(id: number, u: { name?: string; role?: AdminRole; active?: boolean; password?: string }) {
  const [cur] = await q("SELECT * FROM admins WHERE id = $1", [id]);
  if (!cur) return null;
  await q("UPDATE admins SET name = $1, role = $2, active = $3 WHERE id = $4", [
    u.name ?? String(cur.name),
    u.role ?? String(cur.role),
    u.active === undefined ? !!cur.active : u.active,
    id,
  ]);
  if (u.password) await q("UPDATE admins SET password_hash = $1 WHERE id = $2", [hashPassword(u.password), id]);
  const [r] = await q("SELECT * FROM admins WHERE id = $1", [id]);
  return rowToAdmin(r);
}

export async function countActiveAdmins(): Promise<number> {
  const [{ n }] = await q<{ n: number }>("SELECT COUNT(*)::int AS n FROM admins WHERE role = 'admin' AND active");
  return n;
}

export async function checkPassword(id: number, password: string): Promise<boolean> {
  const [r] = await q<{ password_hash: string }>("SELECT password_hash FROM admins WHERE id = $1", [id]);
  return !!r && verifyPassword(password, r.password_hash);
}
