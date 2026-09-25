import { z } from "zod";
import { cookies } from "next/headers";
import { fail, handle, ok, readJson } from "@/lib/server/api";
import {
  SESSION_COOKIE,
  authenticate,
  clearFailures,
  cookieOptions,
  createSessionToken,
  loginBlocked,
  registerFailure,
} from "@/lib/server/auth";
import { clientIp } from "@/lib/server/ratelimit";

const schema = z.object({
  email: z.string().trim().max(160),
  password: z.string().max(200),
});

export const POST = handle(async (req: Request) => {
  const { email, password } = await readJson(req, schema);
  const key = `${clientIp(req)}:${email.toLowerCase()}`;
  const wait = await loginBlocked(key);
  if (wait) return fail(429, `Muitas tentativas. Tente novamente em ${wait} min.`);

  const admin = await authenticate(email, password);
  if (!admin) {
    await registerFailure(key);
    return fail(401, "E-mail ou senha incorretos.");
  }
  await clearFailures(key);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(admin.id), cookieOptions);
  return ok({ ok: true, name: admin.name });
});
