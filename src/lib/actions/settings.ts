"use server";

import { getAdminUser } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { revalidateStore } from "@/lib/revalidate";
import { deleteStoredImage, storagePathFromUrl, uploadImage, validateImageFile } from "@/lib/storage";
import type { StoreSettings } from "@/lib/types";
import { fieldErrorsFrom, firstZodError, settingsSchema } from "@/lib/validation";

export type SettingsFormState = {
  error?: string;
  success?: boolean;
  settings?: StoreSettings;
  fieldErrors?: Record<string, string[]>;
} | null;

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function updateSettingsAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const parsed = settingsSchema.safeParse({
    storeName: formData.get("storeName"),
    brandColor: formData.get("brandColor"),
    whatsapp: formData.get("whatsapp"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    currency: formData.get("currency") ?? "ARS",
    locale: formData.get("locale") ?? "es-AR",
  });

  if (!parsed.success) {
    return {
      error: firstZodError(parsed.error),
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const repo = getRepo();
  const current = await repo.getSettings();
  const removeLogo = formData.get("removeLogo") === "1";
  const logoFile = formData.get("logo");

  let logoUrl = removeLogo ? null : current.logoUrl;
  let uploadedLogo: { url: string; storagePath: string | null } | null = null;

  if (logoFile instanceof File && logoFile.size > 0) {
    const fileError = validateImageFile(logoFile);
    if (fileError) return { error: fileError };

    try {
      uploadedLogo = await uploadImage(logoFile, "brand");
      logoUrl = uploadedLogo.url;
    } catch (error) {
      return { error: message(error, "No pudimos subir el logo.") };
    }
  }

  const nextSettings: StoreSettings = {
    ...parsed.data,
    logoUrl,
  };

  try {
    await repo.updateSettings(nextSettings);
  } catch (error) {
    if (uploadedLogo) await deleteStoredImage(uploadedLogo.storagePath);
    return { error: message(error, "No pudimos guardar la configuración.") };
  }

  if (current.logoUrl && current.logoUrl !== logoUrl) {
    await deleteStoredImage(storagePathFromUrl(current.logoUrl));
  }

  revalidateStore();
  return { success: true, settings: nextSettings };
}
