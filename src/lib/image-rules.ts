export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const IMAGE_ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");

export function validateImageFile(file: File): string | null {
  if (!file || file.size === 0) return "El archivo está vacío.";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Formato no admitido. Usá JPG, PNG, WebP o AVIF.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "La imagen supera los 5 MB.";
  }
  return null;
}

export function imageExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  return "jpg";
}
