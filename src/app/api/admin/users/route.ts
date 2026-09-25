import { fail, handle, ok, readJson } from "@/lib/server/api";
import { createAdmin, listAdmins, requireAdmin } from "@/lib/server/auth";
import { userSchema } from "@/lib/server/schemas";

export const GET = handle(async () => {
  await requireAdmin(["admin"]);
  return ok({ users: await listAdmins() });
});

export const POST = handle(async (req: Request) => {
  await requireAdmin(["admin"]);
  const input = await readJson(req, userSchema);
  if ((await listAdmins()).some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    return fail(409, "Já existe um usuário com este e-mail.");
  }
  return ok({ user: await createAdmin(input) }, { status: 201 });
});
