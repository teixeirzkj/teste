import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { q } from "./db";
import { HttpError } from "./api";

// A Vercel aceita no máximo ~4,5 MB por requisição; o painel já reduz a foto antes de enviar.
const MAX_BYTES = 4 * 1024 * 1024;

/** Confere o tipo real do arquivo pelos primeiros bytes (não pela extensão). */
function isImage(buf: Buffer): boolean {
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  const gif = buf.subarray(0, 4).toString("ascii") === "GIF8";
  const avif = buf.subarray(4, 12).toString("ascii").startsWith("ftypavi");
  return jpeg || png || webp || gif || avif;
}

/**
 * Valida, reprocessa (remove metadados/EXIF) e salva como WebP no banco,
 * com nome gerado no servidor. Servida em /uploads/<uuid>.webp com cache longo na CDN.
 */
export async function saveImage(file: File, kind: "product" | "logo" = "product"): Promise<string> {
  if (file.size > MAX_BYTES) throw new HttpError(413, "Imagem muito grande (máximo 4 MB).");
  const buf = Buffer.from(await file.arrayBuffer());
  if (!isImage(buf)) throw new HttpError(415, "Envie uma imagem JPG, PNG ou WebP.");
  let out: Buffer;
  try {
    const img = sharp(buf, { limitInputPixels: 40_000_000 }).rotate();
    out = await (kind === "logo"
      ? img.resize(640, 640, { fit: "inside", withoutEnlargement: true }).webp({ quality: 90 })
      : img.resize(1200, 900, { fit: "cover", position: "attention" }).webp({ quality: 80 })
    ).toBuffer();
  } catch {
    throw new HttpError(415, "Não foi possível ler esta imagem.");
  }
  const name = `${randomUUID()}.webp`;
  await q("INSERT INTO uploads (name, data) VALUES ($1, $2)", [name, out]);
  return `/uploads/${name}`;
}

export async function readUpload(name: string): Promise<Uint8Array | null> {
  if (!/^[0-9a-f-]{36}\.webp$/.test(name)) return null;
  const [r] = await q<{ data: Uint8Array }>("SELECT data FROM uploads WHERE name = $1", [name]);
  return r ? new Uint8Array(r.data) : null;
}
