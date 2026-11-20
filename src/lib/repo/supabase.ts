import { defaultSettings } from "@/config/brand";
import { slugify } from "@/lib/format";
import type {
  Category,
  ImportRow,
  Product,
  ProductCounts,
  ProductFilters,
  ProductStatus,
  StoreSettings,
} from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CatalogRepo, ProductWriteInput, PublicProductFilters } from "@/lib/repo/types";

const PRODUCT_SELECT = `
  id, name, slug, description, sku, category_id, price, stock, status,
  created_at, updated_at,
  categories ( name ),
  product_images ( id, url, storage_path, alt, sort_order )
`;

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function sanitizeSearch(value: string) {
  return value.replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
}

function dbError(error: { code?: string; message: string } | null, fallback: string): never {
  if (error) console.error("[supabase]", error.message);
  if (error?.code === "23505") {
    if (error.message.includes("sku")) {
      throw new Error("El SKU ya está en uso por otro producto.");
    }
    if (error.message.includes("slug")) {
      throw new Error("Ya existe un producto con una URL similar. Probá con otro nombre.");
    }
    throw new Error("Ya existe un registro con esos datos.");
  }
  if (error?.code === "23503") {
    throw new Error("La categoría seleccionada no existe.");
  }
  throw new Error(fallback);
}

function mapProduct(row: Record<string, unknown>): Product {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const images = Array.isArray(row.product_images) ? row.product_images : [];

  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? "",
    sku: row.sku as string,
    categoryId: (row.category_id as string) ?? null,
    categoryName: (category as { name?: string } | null)?.name ?? null,
    price: Number(row.price ?? 0),
    stock: Number(row.stock ?? 0),
    status: row.status as ProductStatus,
    images: images
      .map((image) => {
        const item = image as Record<string, unknown>;
        return {
          id: item.id as string,
          url: item.url as string,
          storagePath: (item.storage_path as string) ?? null,
          alt: (item.alt as string) ?? null,
          sortOrder: Number(item.sort_order ?? 0),
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function uniqueSlug(supabase: SupabaseServer, base: string, ignoreId?: string) {
  const root = slugify(base) || "producto";
  const { data } = await supabase.from("products").select("slug").like("slug", `${root}%`);
  const taken = new Set(
    (data ?? [])
      .map((row) => row.slug as string)
      .filter((slug) => slug !== ignoreId),
  );
  if (!taken.has(root)) return root;

  let counter = 2;
  while (taken.has(`${root}-${counter}`)) counter += 1;
  return `${root}-${counter}`;
}

async function ensureSkuAvailable(supabase: SupabaseServer, sku: string, ignoreId?: string) {
  let query = supabase.from("products").select("id").ilike("sku", sku);
  if (ignoreId) query = query.neq("id", ignoreId);
  const { data } = await query.limit(1);
  if (data && data.length > 0) {
    throw new Error(`El SKU ${sku} ya está en uso por otro producto.`);
  }
}

async function ensureCategoryName(
  supabase: SupabaseServer,
  name: string,
  ignoreId?: string,
) {
  let query = supabase.from("categories").select("id").ilike("name", name);
  if (ignoreId) query = query.neq("id", ignoreId);
  const { data } = await query.limit(1);
  if (data && data.length > 0) throw new Error(`Ya existe una categoría llamada "${name}".`);
}

async function replaceImages(
  supabase: SupabaseServer,
  productId: string,
  images: ProductWriteInput["images"],
) {
  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);
  if (deleteError) dbError(deleteError, "No pudimos actualizar las fotos del producto.");

  if (images.length === 0) return;

  const { error } = await supabase.from("product_images").insert(
    images.map((image, index) => ({
      product_id: productId,
      url: image.url,
      storage_path: image.storagePath,
      alt: image.alt,
      sort_order: image.sortOrder ?? index,
    })),
  );
  if (error) dbError(error, "No pudimos guardar las fotos del producto.");
}

async function fetchProductById(supabase: SupabaseServer, id: string) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) dbError(error, "No pudimos leer el producto.");
  return data ? mapProduct(data as Record<string, unknown>) : null;
}

export const supabaseRepo: CatalogRepo = {
  async listProducts(filters: ProductFilters) {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .order("created_at", { ascending: false })
      .limit(300);

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }
    if (filters.q?.trim()) {
      const term = sanitizeSearch(filters.q);
      if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) dbError(error, "No pudimos cargar los productos.");
    return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  },

  async getProductCounts(): Promise<ProductCounts> {
    const supabase = await createSupabaseServerClient();
    const base = () => supabase.from("products").select("*", { count: "exact", head: true });
    const [all, draft, published, archived] = await Promise.all([
      base(),
      base().eq("status", "draft"),
      base().eq("status", "published"),
      base().eq("status", "archived"),
    ]);

    return {
      all: all.count ?? 0,
      draft: draft.count ?? 0,
      published: published.count ?? 0,
      archived: archived.count ?? 0,
    };
  },

  async getProductById(id: string) {
    const supabase = await createSupabaseServerClient();
    return fetchProductById(supabase, id);
  },

  async getPublishedProductBySlug(slug: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) dbError(error, "No pudimos leer el producto.");
    return data ? mapProduct(data as Record<string, unknown>) : null;
  },

  async listPublishedProducts(filters: PublicProductFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let categoryId: string | undefined;

    if (filters.categorySlug) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", filters.categorySlug)
        .maybeSingle();
      if (!category) return [];
      categoryId = category.id as string;
    }

    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(200);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (filters.q?.trim()) {
      const term = sanitizeSearch(filters.q);
      if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) dbError(error, "No pudimos cargar el catálogo.");
    return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  },

  async listLowStockProducts(threshold: number) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "published")
      .lt("stock", threshold)
      .order("stock", { ascending: true })
      .limit(50);
    if (error) dbError(error, "No pudimos cargar el stock bajo.");
    return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  },

  async listCategories() {
    const supabase = await createSupabaseServerClient();
    const [categoriesResult, productsResult] = await Promise.all([
      supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
      supabase.from("products").select("category_id"),
    ]);

    if (categoriesResult.error) dbError(categoriesResult.error, "No pudimos cargar las categorías.");
    if (productsResult.error) dbError(productsResult.error, "No pudimos cargar las categorías.");

    const counts = new Map<string, number>();
    (productsResult.data ?? []).forEach((row) => {
      const categoryId = row.category_id as string | null;
      if (!categoryId) return;
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    });

    return (categoriesResult.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      sortOrder: Number(row.sort_order ?? 0),
      productCount: counts.get(row.id as string) ?? 0,
    })) satisfies Category[];
  },

  async getSettings(): Promise<StoreSettings> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();

    if (error) dbError(error, "No pudimos cargar la configuración.");
    if (!data) return { ...defaultSettings };

    return {
      storeName: (data.store_name as string) || defaultSettings.storeName,
      logoUrl: (data.logo_url as string | null) ?? null,
      brandColor: (data.brand_color as string) || defaultSettings.brandColor,
      whatsapp: (data.whatsapp as string) || defaultSettings.whatsapp,
      lowStockThreshold: Number(data.low_stock_threshold ?? defaultSettings.lowStockThreshold),
      currency: (data.currency as string) || defaultSettings.currency,
      locale: (data.locale as string) || defaultSettings.locale,
    };
  },

  async createProduct(input: ProductWriteInput) {
    const supabase = await createSupabaseServerClient();
    await ensureSkuAvailable(supabase, input.sku);
    const slug = await uniqueSlug(supabase, input.name);

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: input.name,
        slug,
        description: input.description,
        sku: input.sku,
        category_id: input.categoryId,
        price: input.price,
        stock: input.stock,
        status: input.status,
      })
      .select("id")
      .single();

    if (error) dbError(error, "No pudimos crear el producto.");

    await replaceImages(supabase, data.id as string, input.images);
    const product = await fetchProductById(supabase, data.id as string);
    if (!product) throw new Error("El producto se creó pero no pudimos leerlo.");
    return product;
  },

  async updateProduct(id: string, input: ProductWriteInput) {
    const supabase = await createSupabaseServerClient();
    await ensureSkuAvailable(supabase, input.sku, id);

    const { error } = await supabase
      .from("products")
      .update({
        name: input.name,
        description: input.description,
        sku: input.sku,
        category_id: input.categoryId,
        price: input.price,
        stock: input.stock,
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) dbError(error, "No pudimos guardar el producto.");
    await replaceImages(supabase, id, input.images);

    const product = await fetchProductById(supabase, id);
    if (!product) throw new Error("El producto no existe.");
    return product;
  },

  async setProductStatus(id: string, status: ProductStatus) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("products")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) dbError(error, "No pudimos cambiar el estado del producto.");

    const product = await fetchProductById(supabase, id);
    if (!product) throw new Error("El producto no existe.");
    return product;
  },

  async quickUpdateProduct(id: string, price: number, stock: number) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("products")
      .update({ price, stock, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) dbError(error, "No pudimos actualizar precio y stock.");

    const product = await fetchProductById(supabase, id);
    if (!product) throw new Error("El producto no existe.");
    return product;
  },

  async duplicateProduct(id: string) {
    const supabase = await createSupabaseServerClient();
    const original = await fetchProductById(supabase, id);
    if (!original) throw new Error("El producto no existe.");

    let sku = `${original.sku}-COPIA`;
    let counter = 2;
    while (true) {
      const { data } = await supabase.from("products").select("id").ilike("sku", sku).limit(1);
      if (!data || data.length === 0) break;
      sku = `${original.sku}-COPIA-${counter}`;
      counter += 1;
    }

    const slug = await uniqueSlug(supabase, `${original.slug}-copia`);
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: `${original.name} (copia)`,
        slug,
        description: original.description,
        sku,
        category_id: original.categoryId,
        price: original.price,
        stock: original.stock,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) dbError(error, "No pudimos duplicar el producto.");

    await replaceImages(
      supabase,
      data.id as string,
      original.images.map((image, index) => ({
        url: image.url,
        storagePath: image.storagePath,
        alt: image.alt,
        sortOrder: image.sortOrder ?? index,
      })),
    );

    const copy = await fetchProductById(supabase, data.id as string);
    if (!copy) throw new Error("La copia se creó pero no pudimos leerla.");
    return copy;
  },

  async createCategory(name: string) {
    const supabase = await createSupabaseServerClient();
    await ensureCategoryName(supabase, name);

    const { data: last } = await supabase
      .from("categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        slug: slugify(name),
        sort_order: Number(last?.sort_order ?? -1) + 1,
      })
      .select("id, name, slug, sort_order")
      .single();

    if (error) dbError(error, "No pudimos crear la categoría.");
    return {
      id: data.id as string,
      name: data.name as string,
      slug: data.slug as string,
      sortOrder: Number(data.sort_order ?? 0),
      productCount: 0,
    } satisfies Category;
  },

  async renameCategory(id: string, name: string) {
    const supabase = await createSupabaseServerClient();
    await ensureCategoryName(supabase, name, id);

    const { data, error } = await supabase
      .from("categories")
      .update({ name, slug: slugify(name) })
      .eq("id", id)
      .select("id, name, slug, sort_order")
      .single();
    if (error) dbError(error, "No pudimos renombrar la categoría.");

    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", id);

    return {
      id: data.id as string,
      name: data.name as string,
      slug: data.slug as string,
      sortOrder: Number(data.sort_order ?? 0),
      productCount: count ?? 0,
    } satisfies Category;
  },

  async moveCategory(id: string, direction: "up" | "down") {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, sort_order")
      .order("sort_order")
      .order("name");
    if (error) dbError(error, "No pudimos ordenar las categorías.");

    const ordered = data ?? [];
    const index = ordered.findIndex((category) => category.id === id);
    if (index === -1) throw new Error("La categoría no existe.");
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ordered.length) return;

    const updates = [
      supabase.from("categories").update({ sort_order: target }).eq("id", ordered[index].id),
      supabase.from("categories").update({ sort_order: index }).eq("id", ordered[target].id),
    ];
    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) dbError(failed.error, "No pudimos ordenar las categorías.");
  },

  async deleteCategory(id: string, reassignTo?: string) {
    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", id);

    if ((count ?? 0) > 0) {
      if (!reassignTo) {
        throw new Error(
          `La categoría tiene ${count} producto(s). Elegí una categoría de destino para reasignarlos.`,
        );
      }
      if (reassignTo === id) throw new Error("Elegí una categoría de destino distinta.");

      const { error: reassignError } = await supabase
        .from("products")
        .update({ category_id: reassignTo })
        .eq("category_id", id);
      if (reassignError) dbError(reassignError, "No pudimos reasignar los productos.");
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) dbError(error, "No pudimos eliminar la categoría.");
  },

  async updateSettings(input: StoreSettings) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("site_settings").upsert(
      {
        id: true,
        store_name: input.storeName,
        logo_url: input.logoUrl,
        brand_color: input.brandColor,
        whatsapp: input.whatsapp,
        low_stock_threshold: input.lowStockThreshold,
        currency: input.currency,
        locale: input.locale,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) dbError(error, "No pudimos guardar la configuración.");
    return input;
  },

  async importProducts(rows: ImportRow[]) {
    if (rows.some((row) => row.errors.length > 0 || row.status === "error")) {
      throw new Error("El archivo contiene errores. No se aplicó ningún cambio.");
    }

    const supabase = await createSupabaseServerClient();
    const { data: categories, error: categoryError } = await supabase
      .from("categories")
      .select("id, name");
    if (categoryError) dbError(categoryError, "No pudimos cargar las categorías.");

    const categoryByName = new Map(
      (categories ?? []).map((category) => [
        (category.name as string)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase(),
        category.id as string,
      ]),
    );

    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const normalizedName = row.categoryName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const categoryId = categoryByName.get(normalizedName);
      if (!categoryId || !row.productStatus || row.price === null || row.stock === null) {
        throw new Error(`La fila ${row.line} tiene datos inválidos. No se aplicó ningún cambio.`);
      }

      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .ilike("sku", row.sku)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("products")
          .update({
            name: row.name,
            description: row.raw.descripcion ?? "",
            category_id: categoryId,
            price: row.price,
            stock: row.stock,
            status: row.productStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) dbError(error, `No pudimos actualizar el SKU ${row.sku}.`);
        updated += 1;
      } else {
        const slug = await uniqueSlug(supabase, row.name);
        const { error } = await supabase.from("products").insert({
          name: row.name,
          slug,
          description: row.raw.descripcion ?? "",
          sku: row.sku,
          category_id: categoryId,
          price: row.price,
          stock: row.stock,
          status: row.productStatus,
        });
        if (error) dbError(error, `No pudimos crear el SKU ${row.sku}.`);
        created += 1;
      }
    }

    return { created, updated };
  },

  async listProductsForImport() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("products").select("id, sku").limit(1000);
    if (error) dbError(error, "No pudimos preparar la importación.");
    return (data ?? []).map((row) => ({ id: row.id as string, sku: row.sku as string }));
  },
};
