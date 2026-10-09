import { fail, handle, ok } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { saveImage } from "@/lib/server/uploads";

export const POST = handle(async (req: Request) => {
  await requireAdmin(["admin"]);
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail(400, "Nenhuma imagem enviada.");
  const k = form.get("kind");
  const kind = k === "logo" || k === "hero" ? k : "product";
  return ok({ url: await saveImage(file, kind) }, { status: 201 });
});
