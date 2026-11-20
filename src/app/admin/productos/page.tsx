import type { Metadata } from "next";
import { ProductsWorkspace } from "@/components/admin/products-workspace";
import { getRepo } from "@/lib/repo";
import { PRODUCT_STATUSES, type ProductStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Productos",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const repo = getRepo();

  const [settings, categories] = await Promise.all([repo.getSettings(), repo.listCategories()]);

  const statusParam = first(params.status);
  const status: ProductStatus | "all" = PRODUCT_STATUSES.includes(statusParam as ProductStatus)
    ? (statusParam as ProductStatus)
    : "all";
  const q = (first(params.q) ?? "").slice(0, 120);
  const categoryParam = first(params.categoria) ?? "";
  const categoryId = categories.some((category) => category.id === categoryParam)
    ? categoryParam
    : "";

  const [products, counts, lowStock] = await Promise.all([
    repo.listProducts({ status, categoryId: categoryId || undefined, q }),
    repo.getProductCounts(),
    repo.listLowStockProducts(settings.lowStockThreshold),
  ]);

  return (
    <ProductsWorkspace
      products={products}
      counts={counts}
      categories={categories}
      lowStock={lowStock}
      settings={settings}
      filters={{ status, q, categoryId }}
      saved={first(params.saved)}
    />
  );
}
