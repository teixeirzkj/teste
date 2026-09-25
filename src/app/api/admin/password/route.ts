import { z } from "zod";
import { fail, handle, ok, readJson } from "@/lib/server/api";
import { checkPassword, requireAdmin, updateAdmin } from "@/lib/server/auth";

const schema = z.object({
  current: z.string().max(200),
  next: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres.").max(200),
});

export const POST = handle(async (req: Request) => {
  const me = await requireAdmin();
  const { current, next } = await readJson(req, schema);
  if (!await checkPassword(me.id, current)) return fail(403, "Senha atual incorreta.");
  await updateAdmin(me.id, { password: next });
  return ok({ ok: true });
});
