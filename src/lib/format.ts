// Utilitários puros (seguros para uso no cliente e no servidor).

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function money(cents: number): string {
  return brl.format((cents || 0) / 100);
}

/** "39,90" | "39.90" | "R$ 39,90" -> 3990 */
export function parseMoney(input: string | number): number {
  if (typeof input === "number") return Math.round(input * 100);
  const clean = input.replace(/[^\d,.-]/g, "");
  if (!clean) return 0;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Número para links do WhatsApp (com DDI 55). */
export function waNumber(phone: string): string {
  const d = onlyDigits(phone);
  if (d.startsWith("55") && d.length >= 12) return d;
  return `55${d}`;
}

export function waLink(phone: string, text?: string): string {
  const base = `https://api.whatsapp.com/send?phone=${waNumber(phone)}`;
  return text ? `${base}&text=${encodeURIComponent(text)}` : base;
}

export function minPrice(sizes: { price: number }[]): number {
  return sizes.length ? Math.min(...sizes.map((s) => s.price)) : 0;
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function mapsLink(parts: string[]): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.filter(Boolean).join(", "))}`;
}
