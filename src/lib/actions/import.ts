"use server";

import { getAdminUser } from "@/lib/auth";
import { buildImportPreview } from "@/lib/csv";
import { getRepo } from "@/lib/repo";
import { revalidateStore } from "@/lib/revalidate";
import type { ImportPreview } from "@/lib/types";

const MAX_CSV_SIZE = 2 * 1024 * 1024;

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function buildPreview(csvText: string): Promise<ImportPreview> {
  const repo = getRepo();
  const [categories, existing] = await Promise.all([
    repo.listCategories(),
    repo.listProductsForImport(),
  ]);
  return buildImportPreview(csvText, categories, existing);
}

export async function previewImportAction(
  csvText: string,
): Promise<{ ok: true; preview: ImportPreview } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };

  if (typeof csvText !== "string" || !csvText.trim()) {
    return { ok: false, error: "El archivo está vacío." };
  }
  if (csvText.length > MAX_CSV_SIZE) {
    return { ok: false, error: "El archivo supera los 2 MB." };
  }

  try {
    const preview = await buildPreview(csvText);
    return { ok: true, preview };
  } catch (error) {
    return { ok: false, error: message(error, "No pudimos leer el archivo.") };
  }
}

export async function applyImportAction(
  csvText: string,
): Promise<
  { ok: true; created: number; updated: number } | { ok: false; error: string }
> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };

  if (typeof csvText !== "string" || !csvText.trim()) {
    return { ok: false, error: "El archivo está vacío. No se aplicó ningún cambio." };
  }
  if (csvText.length > MAX_CSV_SIZE) {
    return { ok: false, error: "El archivo supera los 2 MB. No se aplicó ningún cambio." };
  }

  try {
    // Se revalida en el servidor: nunca confiamos en la vista previa del cliente.
    const preview = await buildPreview(csvText);

    if (preview.fatalError) {
      return { ok: false, error: `${preview.fatalError} No se aplicó ningún cambio.` };
    }
    if (preview.errorCount > 0) {
      return {
        ok: false,
        error: `Hay ${preview.errorCount} fila(s) con errores. No se aplicó ningún cambio.`,
      };
    }
    if (preview.rows.length === 0) {
      return { ok: false, error: "No hay filas para importar. No se aplicó ningún cambio." };
    }

    const result = await getRepo().importProducts(preview.rows);
    revalidateStore();
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error: message(error, "No pudimos aplicar la importación. No se aplicó ningún cambio."),
    };
  }
}
