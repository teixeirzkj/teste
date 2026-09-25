import "server-only";
import { z } from "zod";

const str = (max: number) => z.string().trim().max(max);
const cents = z.number().int().min(0).max(100_000_00);

/** Só aceita imagens servidas pelo próprio site. */
export const imagePath = z
  .string()
  .trim()
  .max(200)
  .regex(/^\/(img|uploads)\/[\w.\-/]+$|^\/logo\.webp$/, "Imagem inválida.")
  .nullable()
  .default(null);

export const productSchema = z.object({
  categoryId: z.number().int().positive("Escolha uma categoria."),
  name: str(100).min(1, "Informe o nome do produto."),
  description: str(400).default(""),
  ingredients: z.array(str(60).min(1)).max(30).default([]),
  image: imagePath,
  sizes: z
    .array(z.object({ name: str(40).min(1, "Informe o nome do tamanho."), price: cents, oldPrice: cents.nullable().optional() }))
    .min(1, "Informe ao menos um preço.")
    .max(10),
  addons: z.array(z.object({ name: str(80).min(1, "Informe o nome do adicional."), price: cents })).max(40).default([]),
  costPercent: z.number().min(0).max(100).nullable().default(null),
  active: z.boolean().default(true),
  isPromo: z.boolean().default(false),
  isBest: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

export const productFlagsSchema = z.object({
  active: z.boolean().optional(),
  isPromo: z.boolean().optional(),
  isBest: z.boolean().optional(),
  isNew: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: str(60).min(1, "Informe o nome da categoria."),
  image: imagePath,
  active: z.boolean().default(true),
});

export const reorderSchema = z.object({
  table: z.enum(["products", "categories"]),
  ids: z.array(z.number().int().positive()).max(500),
});

export const settingsSchema = z
  .object({
    storeName: str(80).min(1),
    tagline: str(120),
    logo: z.string().trim().max(200).regex(/^\/(img|uploads)\/[\w.\-/]+$|^\/logo\.webp$/),
    phone: str(30),
    whatsapp: str(30).refine((v) => v.replace(/\D/g, "").length >= 10, "WhatsApp inválido (use DDD + número)."),
    address: str(200),
    city: str(80),
    instagram: str(120),
    facebook: str(120),
    email: str(120),
    hoursText: str(120),
    days: z.array(z.number().int().min(0).max(6)).max(7),
    deliveryFee: cents,
    minOrder: cents,
    deliveryTime: str(40),
    payments: z
      .array(z.object({ id: str(40).min(1), name: str(40).min(1), active: z.boolean(), allowChange: z.boolean() }))
      .min(1)
      .max(12),
    whatsappHeader: str(200),
    whatsappFooter: str(300),
    isOpen: z.boolean(),
    openMessage: str(120),
    closedMessage: str(160),
    defaultCostPercent: z.number().min(0).max(100),
  })
  .partial();

export const userSchema = z.object({
  name: str(80).min(1, "Informe o nome."),
  email: z.email("E-mail inválido.").max(160),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(200),
  role: z.enum(["admin", "atendente"]),
});

export const userPatchSchema = z.object({
  name: str(80).min(1).optional(),
  role: z.enum(["admin", "atendente"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(200).optional(),
});
