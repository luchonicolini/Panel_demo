import { z } from "zod";
import { PRODUCT_STATUSES } from "@/lib/types";
import { parsePriceInput } from "@/lib/format";

const priceField = z.preprocess((value) => {
  if (typeof value === "string") return parsePriceInput(value);
  return value;
}, z.number({ error: "Ingresá un precio válido" }).min(0, "El precio no puede ser negativo").max(99_999_999, "El precio es demasiado alto"));

const stockField = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return Number(trimmed.replace(/\./g, "").replace(",", "."));
  }
  return value;
}, z.number({ error: "Ingresá un stock válido" }).int("El stock debe ser un número entero").min(0, "El stock no puede ser negativo").max(999_999, "El stock es demasiado alto"));

const skuField = z
  .string()
  .trim()
  .min(2, "El SKU debe tener al menos 2 caracteres")
  .max(40, "El SKU no puede superar los 40 caracteres")
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Usá letras, números, puntos, guiones o guiones bajos")
  .transform((value) => value.toUpperCase());

export const productSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(120, "El nombre es demasiado largo"),
  description: z.string().trim().max(5000, "La descripción es demasiado larga").optional().default(""),
  sku: skuField,
  categoryId: z.string().uuid("Elegí una categoría válida"),
  price: priceField,
  stock: stockField,
  status: z.enum(PRODUCT_STATUSES),
});

export const quickEditSchema = z.object({
  id: z.string().uuid("Producto inválido"),
  price: priceField,
  stock: stockField,
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Ingresá un nombre").max(60, "El nombre es demasiado largo"),
});

export const settingsSchema = z.object({
  storeName: z.string().trim().min(2, "El nombre de la tienda es obligatorio").max(80, "El nombre es demasiado largo"),
  brandColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, "Usá un color hex de 6 dígitos, por ejemplo #c9f26b"),
  whatsapp: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length >= 8 && value.length <= 15, "Ingresá el número con código de país, solo dígitos"),
  lowStockThreshold: z.preprocess(
    (value) => (typeof value === "string" ? Number(value.trim()) : value),
    z.number({ error: "Ingresá un umbral válido" }).int("Usá un número entero").min(1, "El umbral debe ser al menos 1").max(10_000, "El umbral es demasiado alto"),
  ),
  currency: z.string().trim().default("ARS"),
  locale: z.string().trim().default("es-AR"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type QuickEditInput = z.infer<typeof quickEditSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;

export function fieldErrorsFrom(error: z.ZodError) {
  const flat = error.flatten();
  return flat.fieldErrors as Record<string, string[]>;
}

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revisá los datos ingresados";
}
