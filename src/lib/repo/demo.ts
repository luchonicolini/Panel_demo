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
import { readDemoDb, withDemoDb } from "@/lib/demo/db";
import type { DemoDb, DemoProduct } from "@/lib/demo/seed";
import type {
  CatalogRepo,
  ProductWriteInput,
  PublicProductFilters,
  SettingsWriteInput,
} from "@/lib/repo/types";

function mapProduct(db: DemoDb, product: DemoProduct): Product {
  const category = db.categories.find((item) => item.id === product.categoryId);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    categoryId: product.categoryId,
    categoryName: category?.name ?? null,
    price: product.price,
    stock: product.stock,
    status: product.status,
    images: [...product.images].sort((a, b) => a.sortOrder - b.sortOrder),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function ensureSkuAvailable(db: DemoDb, sku: string, ignoreId?: string) {
  const exists = db.products.some(
    (product) => product.sku.toUpperCase() === sku.toUpperCase() && product.id !== ignoreId,
  );
  if (exists) throw new Error(`El SKU ${sku} ya está en uso por otro producto.`);
}

function uniqueSlug(db: DemoDb, base: string, ignoreId?: string) {
  const root = slugify(base) || "producto";
  let candidate = root;
  let counter = 2;
  while (db.products.some((product) => product.slug === candidate && product.id !== ignoreId)) {
    candidate = `${root}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function ensureCategory(db: DemoDb, categoryId: string) {
  const category = db.categories.find((item) => item.id === categoryId);
  if (!category) throw new Error("La categoría seleccionada no existe.");
  return category;
}

function ensureCategoryName(db: DemoDb, name: string, ignoreId?: string) {
  const exists = db.categories.some(
    (category) => normalize(category.name) === normalize(name) && category.id !== ignoreId,
  );
  if (exists) throw new Error(`Ya existe una categoría llamada "${name}".`);
}

function imageRows(images: ProductWriteInput["images"]) {
  return images.map((image, index) => ({
    id: crypto.randomUUID(),
    url: image.url,
    storagePath: image.storagePath,
    alt: image.alt,
    sortOrder: image.sortOrder ?? index,
  }));
}

function categoryWithCount(db: DemoDb, category: DemoDb["categories"][number]): Category {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
    productCount: db.products.filter((product) => product.categoryId === category.id).length,
  };
}

export const demoRepo: CatalogRepo = {
  async listProducts(filters: ProductFilters) {
    const db = await readDemoDb();
    let products = db.products.map((product) => mapProduct(db, product));

    if (filters.status && filters.status !== "all") {
      products = products.filter((product) => product.status === filters.status);
    }
    if (filters.categoryId) {
      products = products.filter((product) => product.categoryId === filters.categoryId);
    }
    if (filters.q?.trim()) {
      const query = normalize(filters.q);
      products = products.filter(
        (product) =>
          normalize(product.name).includes(query) || normalize(product.sku).includes(query),
      );
    }

    return products.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getProductCounts(): Promise<ProductCounts> {
    const db = await readDemoDb();
    return {
      all: db.products.length,
      draft: db.products.filter((product) => product.status === "draft").length,
      published: db.products.filter((product) => product.status === "published").length,
      archived: db.products.filter((product) => product.status === "archived").length,
    };
  },

  async getProductById(id: string) {
    const db = await readDemoDb();
    const product = db.products.find((item) => item.id === id);
    return product ? mapProduct(db, product) : null;
  },

  async getPublishedProductBySlug(slug: string) {
    const db = await readDemoDb();
    const product = db.products.find((item) => item.slug === slug && item.status === "published");
    return product ? mapProduct(db, product) : null;
  },

  async listPublishedProducts(filters: PublicProductFilters = {}) {
    const db = await readDemoDb();
    let products = db.products
      .filter((product) => product.status === "published")
      .map((product) => mapProduct(db, product));

    if (filters.categorySlug) {
      const category = db.categories.find((item) => item.slug === filters.categorySlug);
      products = category
        ? products.filter((product) => product.categoryId === category.id)
        : [];
    }
    if (filters.q?.trim()) {
      const query = normalize(filters.q);
      products = products.filter(
        (product) =>
          normalize(product.name).includes(query) || normalize(product.sku).includes(query),
      );
    }

    return products.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listLowStockProducts(threshold: number) {
    const db = await readDemoDb();
    return db.products
      .filter((product) => product.status === "published" && product.stock < threshold)
      .map((product) => mapProduct(db, product))
      .sort((a, b) => a.stock - b.stock);
  },

  async listCategories() {
    const db = await readDemoDb();
    return db.categories
      .map((category) => categoryWithCount(db, category))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  },

  async getSettings(): Promise<StoreSettings> {
    const db = await readDemoDb();
    return { ...defaultSettings, ...db.settings };
  },

  async createProduct(input: ProductWriteInput) {
    return withDemoDb((db) => {
      ensureSkuAvailable(db, input.sku);
      ensureCategory(db, input.categoryId);
      const now = new Date().toISOString();
      const product: DemoProduct = {
        id: crypto.randomUUID(),
        name: input.name,
        slug: uniqueSlug(db, input.name),
        description: input.description,
        sku: input.sku,
        categoryId: input.categoryId,
        price: input.price,
        stock: input.stock,
        status: input.status,
        images: imageRows(input.images),
        createdAt: now,
        updatedAt: now,
      };
      db.products.unshift(product);
      return mapProduct(db, product);
    });
  },

  async updateProduct(id: string, input: ProductWriteInput) {
    return withDemoDb((db) => {
      const product = db.products.find((item) => item.id === id);
      if (!product) throw new Error("El producto no existe.");
      ensureSkuAvailable(db, input.sku, id);
      ensureCategory(db, input.categoryId);

      product.name = input.name;
      product.description = input.description;
      product.sku = input.sku;
      product.categoryId = input.categoryId;
      product.price = input.price;
      product.stock = input.stock;
      product.status = input.status;
      product.images = imageRows(input.images);
      product.updatedAt = new Date().toISOString();

      return mapProduct(db, product);
    });
  },

  async setProductStatus(id: string, status: ProductStatus) {
    return withDemoDb((db) => {
      const product = db.products.find((item) => item.id === id);
      if (!product) throw new Error("El producto no existe.");
      product.status = status;
      product.updatedAt = new Date().toISOString();
      return mapProduct(db, product);
    });
  },

  async quickUpdateProduct(id: string, price: number, stock: number) {
    return withDemoDb((db) => {
      const product = db.products.find((item) => item.id === id);
      if (!product) throw new Error("El producto no existe.");
      product.price = price;
      product.stock = stock;
      product.updatedAt = new Date().toISOString();
      return mapProduct(db, product);
    });
  },

  async duplicateProduct(id: string) {
    return withDemoDb((db) => {
      const original = db.products.find((item) => item.id === id);
      if (!original) throw new Error("El producto no existe.");

      let sku = `${original.sku}-COPIA`;
      let counter = 2;
      while (db.products.some((product) => product.sku.toUpperCase() === sku.toUpperCase())) {
        sku = `${original.sku}-COPIA-${counter}`;
        counter += 1;
      }

      const now = new Date().toISOString();
      const copy: DemoProduct = {
        ...original,
        id: crypto.randomUUID(),
        name: `${original.name} (copia)`,
        slug: uniqueSlug(db, `${original.slug}-copia`),
        sku,
        status: "draft",
        images: original.images.map((image) => ({
          ...image,
          id: crypto.randomUUID(),
        })),
        createdAt: now,
        updatedAt: now,
      };
      db.products.unshift(copy);
      return mapProduct(db, copy);
    });
  },

  async createCategory(name: string) {
    return withDemoDb((db) => {
      ensureCategoryName(db, name);
      const maxOrder = db.categories.reduce(
        (max, category) => Math.max(max, category.sortOrder),
        -1,
      );
      const category = {
        id: crypto.randomUUID(),
        name,
        slug: slugify(name),
        sortOrder: maxOrder + 1,
        createdAt: new Date().toISOString(),
      };
      db.categories.push(category);
      return categoryWithCount(db, category);
    });
  },

  async renameCategory(id: string, name: string) {
    return withDemoDb((db) => {
      const category = db.categories.find((item) => item.id === id);
      if (!category) throw new Error("La categoría no existe.");
      ensureCategoryName(db, name, id);
      category.name = name;
      category.slug = slugify(name);
      return categoryWithCount(db, category);
    });
  },

  async moveCategory(id: string, direction: "up" | "down") {
    return withDemoDb((db) => {
      const ordered = [...db.categories].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      );
      const index = ordered.findIndex((category) => category.id === id);
      if (index === -1) throw new Error("La categoría no existe.");
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= ordered.length) return;

      const current = ordered[index];
      const swap = ordered[target];
      const currentOrder = current.sortOrder;
      current.sortOrder = swap.sortOrder;
      swap.sortOrder = currentOrder;

      // Reindexar para mantener un orden prolijo.
      ordered
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .forEach((category, position) => {
          category.sortOrder = position;
        });
    });
  },

  async deleteCategory(id: string, reassignTo?: string) {
    return withDemoDb((db) => {
      const category = db.categories.find((item) => item.id === id);
      if (!category) throw new Error("La categoría no existe.");

      const assigned = db.products.filter((product) => product.categoryId === id);
      if (assigned.length > 0) {
        if (!reassignTo) {
          throw new Error(
            `La categoría tiene ${assigned.length} producto(s). Elegí una categoría de destino para reasignarlos.`,
          );
        }
        if (reassignTo === id) {
          throw new Error("Elegí una categoría de destino distinta.");
        }
        ensureCategory(db, reassignTo);
        assigned.forEach((product) => {
          product.categoryId = reassignTo;
          product.updatedAt = new Date().toISOString();
        });
      }

      db.categories = db.categories.filter((item) => item.id !== id);
    });
  },

  async updateSettings(input: SettingsWriteInput) {
    return withDemoDb((db) => {
      db.settings = { ...input };
      return { ...input };
    });
  },

  async importProducts(rows: ImportRow[]) {
    return withDemoDb((db) => {
      if (rows.some((row) => row.errors.length > 0 || row.status === "error")) {
        throw new Error("El archivo contiene errores. No se aplicó ningún cambio.");
      }

      let created = 0;
      let updated = 0;

      rows.forEach((row) => {
        const category = db.categories.find(
          (item) => normalize(item.name) === normalize(row.categoryName),
        );
        if (!category || !row.productStatus || row.price === null || row.stock === null) {
          throw new Error(`La fila ${row.line} tiene datos inválidos. No se aplicó ningún cambio.`);
        }

        const existing = db.products.find(
          (product) => product.sku.toUpperCase() === row.sku.toUpperCase(),
        );

        if (existing) {
          existing.name = row.name;
          existing.description = row.raw.descripcion ?? existing.description;
          existing.categoryId = category.id;
          existing.price = row.price;
          existing.stock = row.stock;
          existing.status = row.productStatus;
          existing.updatedAt = new Date().toISOString();
          updated += 1;
        } else {
          const now = new Date().toISOString();
          db.products.unshift({
            id: crypto.randomUUID(),
            name: row.name,
            slug: uniqueSlug(db, row.name),
            description: row.raw.descripcion ?? "",
            sku: row.sku,
            categoryId: category.id,
            price: row.price,
            stock: row.stock,
            status: row.productStatus,
            images: [],
            createdAt: now,
            updatedAt: now,
          });
          created += 1;
        }
      });

      return { created, updated };
    });
  },

  async listProductsForImport() {
    const db = await readDemoDb();
    return db.products.map((product) => ({ id: product.id, sku: product.sku }));
  },
};
