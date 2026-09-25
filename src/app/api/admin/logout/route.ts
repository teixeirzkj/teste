import { cookies } from "next/headers";
import { handle, ok } from "@/lib/server/api";
import { SESSION_COOKIE } from "@/lib/server/auth";

export const POST = handle(async () => {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  return ok({ ok: true });
});
