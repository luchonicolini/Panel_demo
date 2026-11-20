"use server";

import { z } from "zod";
import { getAdminUser } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { revalidateStore } from "@/lib/revalidate";
import type { Category } from "@/lib/types";
import { categorySchema, firstZodError } from "@/lib/validation";

const idSchema = z.string().uuid("Categoría inválida");
const directionSchema = z.enum(["up", "down"]);

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function createCategoryAction(
  name: string,
): Promise<{ ok: true; category: Category } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const parsed = categorySchema.safeParse({ name });
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  try {
    const category = await getRepo().createCategory(parsed.data.name);
    revalidateStore();
    return { ok: true, category };
  } catch (error) {
    return { ok: false, error: message(error, "No pudimos crear la categoría.") };
  }
}

export async function renameCategoryAction(
  id: string,
  name: string,
): Promise<{ ok: true; category: Category } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const parsedId = idSchema.safeParse(id);
  const parsed = categorySchema.safeParse({ name });
  if (!parsedId.success) return { ok: false, error: "Categoría inválida." };
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  try {
    const category = await getRepo().renameCategory(parsedId.data, parsed.data.name);
    revalidateStore();
    return { ok: true, category };
  } catch (error) {
    return { ok: false, error: message(error, "No pudimos renombrar la categoría.") };
  }
}

export async function moveCategoryAction(
  id: string,
  direction: "up" | "down",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const parsedId = idSchema.safeParse(id);
  const parsedDirection = directionSchema.safeParse(direction);
  if (!parsedId.success || !parsedDirection.success) {
    return { ok: false, error: "Datos inválidos." };
  }

  try {
    await getRepo().moveCategory(parsedId.data, parsedDirection.data);
    revalidateStore();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error, "No pudimos ordenar la categoría.") };
  }
}

export async function deleteCategoryAction(
  id: string,
  reassignTo?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Categoría inválida." };
  if (reassignTo) {
    const parsedTarget = idSchema.safeParse(reassignTo);
    if (!parsedTarget.success) return { ok: false, error: "Categoría de destino inválida." };
  }

  try {
    await getRepo().deleteCategory(parsedId.data, reassignTo);
    revalidateStore();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error, "No pudimos eliminar la categoría.") };
  }
}
