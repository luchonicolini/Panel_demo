import type { Metadata } from "next";
import { CategoryManager } from "@/components/admin/category-manager";
import { getRepo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categorías",
};

export default async function CategoriesPage() {
  const categories = await getRepo().listCategories();
  return <CategoryManager categories={categories} />;
}
