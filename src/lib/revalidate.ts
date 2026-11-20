import { revalidatePath } from "next/cache";

export function revalidateAdminCatalog() {
  revalidatePath("/admin/productos");
  revalidatePath("/admin/categorias");
}

export function revalidateProduct(slugs: Array<string | null | undefined>) {
  revalidatePath("/");
  revalidateAdminCatalog();
  const unique = new Set(slugs.filter((slug): slug is string => Boolean(slug)));
  unique.forEach((slug) => revalidatePath(`/producto/${slug}`));
}

export function revalidateStore() {
  revalidatePath("/", "layout");
}
