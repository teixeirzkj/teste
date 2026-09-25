import { handle, ok, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { adminOrderSchema, createOrder, listBoardOrders, listOrders } from "@/lib/server/orders";
import { addDays, dayStartISO, resolvePeriod, type PeriodPreset } from "@/lib/time";

const PRESETS: PeriodPreset[] = ["today", "7d", "30d", "month", "lastMonth", "custom"];

export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  if (url.searchParams.get("view") === "board") {
    return ok({ orders: await listBoardOrders(), serverTime: new Date().toISOString() });
  }
  const p = url.searchParams.get("preset") as PeriodPreset;
  const { from, to } = resolvePeriod(PRESETS.includes(p) ? p : "30d", url.searchParams.get("from") ?? undefined, url.searchParams.get("to") ?? undefined);
  const orders = await listOrders({ fromISO: dayStartISO(from), toISO: dayStartISO(addDays(to, 1)), limit: 5000 });
  return ok({ orders, range: { from, to } });
});

/** Nova venda registrada manualmente no painel (balcão/telefone). */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const input = await readJson(req, adminOrderSchema);
  const order = await createOrder(
    { ...input, phone: input.phone || "" },
    { origin: input.origin, status: input.status, enforceStore: false, deliveryFeeOverride: input.deliveryFee }
  );
  return ok({ order }, { status: 201 });
});
