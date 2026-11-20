import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getRepo } from "@/lib/repo";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return { title: "Producto" };
  const product = await getRepo().getProductById(id);
  return { title: product ? `Editar ${product.name}` : "Producto" };
}

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const repo = getRepo();
  const [product, categories, settings] = await Promise.all([
    repo.getProductById(id),
    repo.listCategories(),
    repo.getSettings(),
  ]);

  if (!product) notFound();

  return <ProductForm product={product} categories={categories} settings={settings} />;
}
