"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminUser } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { revalidateProduct } from "@/lib/revalidate";
import { deleteStoredImage, uploadImage, validateImageFile } from "@/lib/storage";
import type { Product, ProductStatus } from "@/lib/types";
import { fieldErrorsFrom, firstZodError, productSchema, quickEditSchema } from "@/lib/validation";

export type ProductFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

const MAX_IMAGES = 6;

const idSchema = z.string().uuid("Producto inválido");
const statusSchema = z.enum(["draft", "published", "archived"]);

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function parseImageIds(raw: FormDataEntryValue | null) {
  if (!raw) return [] as string[];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export async function saveProductAction(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const id = String(formData.get("id") ?? "").trim() || null;
  if (id) {
    const validId = idSchema.safeParse(id);
    if (!validId.success) return { error: "Producto inválido." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      error: firstZodError(parsed.error),
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const repo = getRepo();
  const existing = id ? await repo.getProductById(id) : null;
  if (id && !existing) return { error: "El producto no existe o ya fue eliminado." };

  // Solo aceptamos imágenes que ya pertenecen al producto; nunca URLs del cliente.
  const requestedIds = parseImageIds(formData.get("existingImageIds"));
  const keptImages = existing
    ? requestedIds
        .map((imageId) => existing.images.find((image) => image.id === imageId))
        .filter((image): image is Product["images"][number] => Boolean(image))
    : [];

  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (keptImages.length + files.length > MAX_IMAGES) {
    return { error: `Podés tener hasta ${MAX_IMAGES} fotos por producto.` };
  }

  for (const file of files) {
    const fileError = validateImageFile(file);
    if (fileError) return { error: fileError };
  }

  const uploaded: Array<{ url: string; storagePath: string | null }> = [];
  try {
    for (const file of files) {
      uploaded.push(await uploadImage(file, "products"));
    }
  } catch (error) {
    await Promise.all(uploaded.map((image) => deleteStoredImage(image.storagePath)));
    return { error: message(error, "No pudimos subir las fotos.") };
  }

  const images = [
    ...keptImages.map((image, index) => ({
      url: image.url,
      storagePath: image.storagePath,
      alt: parsed.data.name,
      sortOrder: index,
    })),
    ...uploaded.map((image, index) => ({
      url: image.url,
      storagePath: image.storagePath,
      alt: parsed.data.name,
      sortOrder: keptImages.length + index,
    })),
  ];

  let product: Product;
  try {
    const input = { ...parsed.data, images };
    product = existing
      ? await repo.updateProduct(existing.id, input)
      : await repo.createProduct(input);
  } catch (error) {
    await Promise.all(uploaded.map((image) => deleteStoredImage(image.storagePath)));
    return { error: message(error, "No pudimos guardar el producto.") };
  }

  if (existing) {
    const keptIds = new Set(keptImages.map((image) => image.id));
    const removed = existing.images.filter((image) => !keptIds.has(image.id));
    await Promise.all(removed.map((image) => deleteStoredImage(image.storagePath)));
  }

  revalidateProduct([existing?.slug, product.slug]);
  redirect(`/admin/productos?saved=${existing ? "actualizado" : "creado"}`);
}

export async function changeProductStatusAction(
  id: string,
  status: ProductStatus,
): Promise<{ ok: true; product: Product } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const parsedId = idSchema.safeParse(id);
  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) {
    return { ok: false, error: "Datos inválidos." };
  }

  try {
    const product = await getRepo().setProductStatus(parsedId.data, parsedStatus.data);
    revalidateProduct([product.slug]);
    return { ok: true, product };
  } catch (error) {
    return { ok: false, error: message(error, "No pudimos cambiar el estado.") };
  }
}

export async function duplicateProductAction(
  id: string,
): Promise<{ ok: true; product: Product } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Producto inválido." };

  try {
    const product = await getRepo().duplicateProduct(parsedId.data);
    revalidateProduct([product.slug]);
    return { ok: true, product };
  } catch (error) {
    return { ok: false, error: message(error, "No pudimos duplicar el producto.") };
  }
}

export async function quickUpdateProductAction(input: {
  id: string;
  price: string | number;
  stock: string | number;
}): Promise<{ ok: true; product: Product } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const parsed = quickEditSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  try {
    const product = await getRepo().quickUpdateProduct(
      parsed.data.id,
      parsed.data.price,
      parsed.data.stock,
    );
    revalidateProduct([product.slug]);
    return { ok: true, product };
  } catch (error) {
    return { ok: false, error: message(error, "No pudimos actualizar precio y stock.") };
  }
}
