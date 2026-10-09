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
/**
 * Pizza da abertura: encontra a pizza (pixels claros sobre fundo escuro),
 * corta um quadrado em volta e aplica máscara redonda com bordas suaves.
 */
async function heroCircle(buf: Buffer): Promise<Buffer> {
  const base = await sharp(buf, { limitInputPixels: 40_000_000 }).rotate().resize(1400, 1400, { fit: "inside", withoutEnlargement: true }).toBuffer();
  const { data, info } = await sharp(base).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
  for (let y = 0; y < info.height; y += 2)
    for (let x = 0; x < info.width; x += 2) {
      const i = (y * info.width + x) * 3;
      if (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11 > 45) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  // Sem fundo escuro detectável: usa o maior círculo centralizado.
  if (x1 <= x0 || y1 <= y0) [x0, y0, x1, y1] = [0, 0, info.width - 1, info.height - 1];
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const r = Math.floor(Math.min((x1 - x0) / 2, (y1 - y0) / 2, cx, cy, info.width - cx, info.height - cy) * 0.99);
  const size = r * 2;
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="g"><stop offset="97%" stop-color="#fff"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="${r}" cy="${r}" r="${r}" fill="url(#g)"/></svg>`
  );
  const square = await sharp(base).extract({ left: Math.round(cx - r), top: Math.round(cy - r), width: size, height: size }).ensureAlpha().toBuffer();
  const cut = await sharp(square).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return sharp(cut).resize(900, 900).webp({ quality: 84, alphaQuality: 90 }).toBuffer();
}

export async function saveImage(file: File, kind: "product" | "logo" | "hero" = "product"): Promise<string> {
  if (file.size > MAX_BYTES) throw new HttpError(413, "Imagem muito grande (máximo 4 MB).");
  const buf = Buffer.from(await file.arrayBuffer());
  if (!isImage(buf)) throw new HttpError(415, "Envie uma imagem JPG, PNG ou WebP.");
  let out: Buffer;
  try {
    const img = sharp(buf, { limitInputPixels: 40_000_000 }).rotate();
    out = kind === "hero" ? await heroCircle(buf) : await (kind === "logo"
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
