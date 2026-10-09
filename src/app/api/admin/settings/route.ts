import { handle, ok, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { getSettings, saveSettings } from "@/lib/server/catalog";
import { lastPrintResult } from "@/lib/server/printer";
import { settingsSchema } from "@/lib/server/schemas";
import type { Settings } from "@/lib/types";

/** O token da maquininha nunca volta inteiro para o navegador. */
const TOKEN_MASK = "••••••••";

function forPanel(s: Settings, isAdmin: boolean): Settings {
  if (!isAdmin) return { ...s, printWebhookUrl: "", printWebhookToken: "" };
  return { ...s, printWebhookToken: s.printWebhookToken ? TOKEN_MASK : "" };
}

export const GET = handle(async () => {
  const admin = await requireAdmin();
  const isAdmin = admin.role === "admin";
  return ok({ settings: forPanel(await getSettings(), isAdmin), printLast: isAdmin ? await lastPrintResult() : null });
});

export const PUT = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const patch = await readJson(req, settingsSchema);
  // Token mascarado = "não mudou".
  if (patch.printWebhookToken === TOKEN_MASK) delete patch.printWebhookToken;
  // Atendentes podem apenas abrir/fechar a loja.
  const allowed = admin.role === "admin" ? patch : { isOpen: patch.isOpen };
  return ok({ settings: forPanel(await saveSettings(allowed), admin.role === "admin") });
});
