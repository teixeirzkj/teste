import { fail, handle, idParam, ok, readJson } from "@/lib/server/api";
import { countActiveAdmins, listAdmins, requireAdmin, updateAdmin } from "@/lib/server/auth";
import { userPatchSchema } from "@/lib/server/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const me = await requireAdmin(["admin"]);
  const id = idParam((await ctx.params).id);
  const patch = await readJson(req, userPatchSchema);
  const target = (await listAdmins()).find((u) => u.id === id);
  if (!target) return fail(404, "Usuário não encontrado.");
  const losesAdmin = target.role === "admin" && target.active && (patch.active === false || patch.role === "atendente");
  if (losesAdmin && await countActiveAdmins() <= 1) return fail(409, "É preciso manter pelo menos um administrador ativo.");
  if (id === me.id && patch.active === false) return fail(409, "Você não pode desativar o seu próprio usuário.");
  return ok({ user: await updateAdmin(id, patch) });
});
