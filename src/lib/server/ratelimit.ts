import "server-only";
import { q } from "./db";

/**
 * Contadores no banco: na Vercel cada requisição pode cair numa instância diferente,
 * então limites em memória não funcionariam.
 */
export async function rateLimitHit(key: string, windowMs: number): Promise<number> {
  const [r] = await q<{ count: number }>(
    `INSERT INTO rate_limits (key, count, reset_at) VALUES ($1, 1, NOW() + ($2 || ' milliseconds')::interval)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.reset_at < NOW() THEN 1 ELSE rate_limits.count + 1 END,
       reset_at = CASE WHEN rate_limits.reset_at < NOW() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
     RETURNING count`,
    [key, String(windowMs)]
  );
  return r.count;
}

export async function rateLimitStatus(key: string): Promise<{ count: number; msLeft: number } | null> {
  const [r] = await q<{ count: number; ms: number }>(
    "SELECT count, (EXTRACT(EPOCH FROM (reset_at - NOW())) * 1000)::int AS ms FROM rate_limits WHERE key = $1 AND reset_at > NOW()",
    [key]
  );
  return r ? { count: r.count, msLeft: r.ms } : null;
}

export async function rateLimitReset(key: string) {
  await q("DELETE FROM rate_limits WHERE key = $1", [key]);
}

/** true se ainda está dentro do limite. */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const count = await rateLimitHit(key, windowMs);
  // Limpeza ocasional de registros vencidos.
  if (Math.random() < 0.02) await q("DELETE FROM rate_limits WHERE reset_at < NOW()");
  return count <= max;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
