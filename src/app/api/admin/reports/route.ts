import { handle, ok } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { buildReport } from "@/lib/server/reports";
import { resolvePeriod, type PeriodPreset } from "@/lib/time";

const PRESETS: PeriodPreset[] = ["today", "7d", "30d", "month", "lastMonth", "custom"];

export const GET = handle(async (req: Request) => {
  await requireAdmin(["admin"]);
  const url = new URL(req.url);
  const p = url.searchParams.get("preset") as PeriodPreset;
  const { from, to } = resolvePeriod(PRESETS.includes(p) ? p : "7d", url.searchParams.get("from") ?? undefined, url.searchParams.get("to") ?? undefined);
  return ok(await buildReport(from, to));
});
