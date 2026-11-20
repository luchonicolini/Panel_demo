"use server";

import { getAdminUser } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import type { ProductStatus } from "@/lib/types";

export type CommandCatalogProduct = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  status: ProductStatus;
};

export type CommandCatalogCategory = {
  id: string;
  name: string;
  slug: string;
};

export type CommandCatalogResult = {
  products: CommandCatalogProduct[];
  categories: CommandCatalogCategory[];
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Búsqueda acotada para la command palette del panel. Valida sesión de admin
 * en el servidor y devuelve solo los campos necesarios para navegar.
 */
export async function searchAdminCatalog(query: string): Promise<CommandCatalogResult> {
  const admin = await getAdminUser();
  if (!admin) return { products: [], categories: [] };

  const q = query.trim().slice(0, 80);
  const repo = getRepo();

  const [products, categories] = await Promise.all([
    repo.listProducts({ status: "all", q: q || undefined }),
    repo.listCategories(),
  ]);

  const normalizedQuery = normalize(q);

  return {
    products: products.slice(0, 8).map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      status: product.status,
    })),
    categories: categories
      .filter(
        (category) =>
          !normalizedQuery || normalize(category.name).includes(normalizedQuery),
      )
      .slice(0, 6)
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      })),
  };
}
