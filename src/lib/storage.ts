import { promises as fs } from "node:fs";
import path from "node:path";
import { PRODUCT_IMAGES_BUCKET, isDemoMode } from "@/lib/env";
import { imageExtension, validateImageFile } from "@/lib/image-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export { validateImageFile } from "@/lib/image-rules";

export type UploadedImage = {
  url: string;
  storagePath: string | null;
};

export async function uploadImage(
  file: File,
  folder: "products" | "brand" = "products",
): Promise<UploadedImage> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const extension = imageExtension(file);
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  if (isDemoMode()) {
    const namespace = process.env.DEMO_UPLOADS_NAMESPACE?.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    const relativeToUploads = namespace ? path.join(namespace, folder) : folder;
    const absoluteDir = path.join(process.cwd(), "public", "uploads", relativeToUploads);
    await fs.mkdir(absoluteDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(absoluteDir, filename), buffer);
    const publicPath = relativeToUploads.replace(/\\/g, "/");
    return {
      url: `/uploads/${publicPath}/${filename}`,
      storagePath: `demo:${publicPath}/${filename}`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const storagePath = `${folder}/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    console.error("[storage]", error.message);
    throw new Error("No pudimos subir la imagen. Revisá las políticas del bucket.");
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);
  return { url: data.publicUrl, storagePath };
}

export async function deleteStoredImage(storagePath: string | null) {
  if (!storagePath) return;

  try {
    if (storagePath.startsWith("demo:")) {
      const relative = storagePath.slice("demo:".length);
      const uploadsRoot = path.join(process.cwd(), "public", "uploads");
      const absolute = path.resolve(uploadsRoot, relative);
      if (!absolute.startsWith(path.resolve(uploadsRoot))) return;
      await fs.unlink(absolute).catch(() => undefined);
      return;
    }

    const supabase = await createSupabaseServerClient();
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
  } catch (error) {
    console.error("[storage] no se pudo borrar la imagen", error);
  }
}

/** Deriva el path de Storage a partir de una URL pública guardada. */
export function storagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/uploads/")) return `demo:${url.slice("/uploads/".length)}`;
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}
