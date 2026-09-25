import { handle, ok, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { getSettings, saveSettings } from "@/lib/server/catalog";
import { settingsSchema } from "@/lib/server/schemas";

export const GET = handle(async () => {
  await requireAdmin();
  return ok({ settings: await getSettings() });
});

export const PUT = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const patch = await readJson(req, settingsSchema);
  // Atendentes podem apenas abrir/fechar a loja.
  const allowed = admin.role === "admin" ? patch : { isOpen: patch.isOpen };
  return ok({ settings: await saveSettings(allowed) });
});
