import { readUpload } from "@/lib/server/uploads";

type Ctx = { params: Promise<{ file: string }> };

/** Serve as imagens enviadas pelo painel (guardadas no banco). O nome é um UUID, então o cache pode ser permanente. */
export async function GET(_req: Request, ctx: Ctx) {
  const data = await readUpload((await ctx.params).file);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(data as BodyInit, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
