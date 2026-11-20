import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { getRepo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuevo producto",
};

export default async function NewProductPage() {
  const repo = getRepo();
  const [categories, settings] = await Promise.all([repo.listCategories(), repo.getSettings()]);

  return <ProductForm categories={categories} settings={settings} />;
}
