// A pizzaria fica na Bahia (UTC-3, sem horário de verão).
// Datas são gravadas em UTC e agrupadas pelo dia/hora local.

export const TZ_OFFSET_MS = -3 * 60 * 60 * 1000;

export function localDate(iso: string | number | Date): Date {
  const t = typeof iso === "string" ? Date.parse(iso) : +iso;
  return new Date(t + TZ_OFFSET_MS);
}

/** "2026-09-25" no horário local. */
export function dayKey(iso: string | number | Date): string {
  return localDate(iso).toISOString().slice(0, 10);
}

export function localHour(iso: string): number {
  return localDate(iso).getUTCHours();
}

export function todayKey(): string {
  return dayKey(Date.now());
}

export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Início do dia local em ISO UTC. */
export function dayStartISO(key: string): string {
  return new Date(Date.parse(`${key}T00:00:00.000Z`) - TZ_OFFSET_MS).toISOString();
}

export type PeriodPreset = "today" | "7d" | "30d" | "month" | "lastMonth" | "custom";

export const PERIOD_LABEL: Record<PeriodPreset, string> = {
  today: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  month: "Este mês",
  lastMonth: "Mês anterior",
  custom: "Personalizado",
};

/** Retorna intervalo [from, to] de chaves de dia (inclusivo). */
export function resolvePeriod(preset: PeriodPreset, from?: string, to?: string): { from: string; to: string } {
  const today = todayKey();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "lastMonth": {
      const firstThis = `${today.slice(0, 7)}-01`;
      const lastPrev = addDays(firstThis, -1);
      return { from: `${lastPrev.slice(0, 7)}-01`, to: lastPrev };
    }
    case "custom": {
      const ok = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
      const f = ok(from) ? from! : addDays(today, -6);
      const t = ok(to) ? to! : today;
      return f <= t ? { from: f, to: t } : { from: t, to: f };
    }
  }
}

export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let k = from; k <= to && out.length < 800; k = addDays(k, 1)) out.push(k);
  return out;
}

export function formatDayKey(key: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit" }) {
  return new Date(`${key}T12:00:00.000Z`).toLocaleDateString("pt-BR", { ...opts, timeZone: "UTC" });
}

export function formatDateTime(iso: string): string {
  return localDate(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function formatTime(iso: string): string {
  return localDate(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

export function timeAgo(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`;
  return formatDateTime(iso);
}
