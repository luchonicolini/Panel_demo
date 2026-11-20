import type {
  Category,
  ImportRow,
  Product,
  ProductCounts,
  ProductFilters,
  ProductStatus,
  StoreSettings,
} from "@/lib/types";

export type ProductImageInput = {
  url: string;
  storagePath: string | null;
  alt: string | null;
  sortOrder: number;
};

export type ProductWriteInput = {
  name: string;
  description: string;
  sku: string;
  categoryId: string;
  price: number;
  stock: number;
  status: ProductStatus;
  images: ProductImageInput[];
};

export type SettingsWriteInput = StoreSettings;

export type PublicProductFilters = {
  categorySlug?: string;
  q?: string;
};

export interface CatalogRepo {
  listProducts(filters: ProductFilters): Promise<Product[]>;
  getProductCounts(): Promise<ProductCounts>;
  getProductById(id: string): Promise<Product | null>;
  getPublishedProductBySlug(slug: string): Promise<Product | null>;
  listPublishedProducts(filters?: PublicProductFilters): Promise<Product[]>;
  listLowStockProducts(threshold: number): Promise<Product[]>;
  listCategories(): Promise<Category[]>;
  getSettings(): Promise<StoreSettings>;
  createProduct(input: ProductWriteInput): Promise<Product>;
  updateProduct(id: string, input: ProductWriteInput): Promise<Product>;
  setProductStatus(id: string, status: ProductStatus): Promise<Product>;
  quickUpdateProduct(id: string, price: number, stock: number): Promise<Product>;
  duplicateProduct(id: string): Promise<Product>;
  createCategory(name: string): Promise<Category>;
  renameCategory(id: string, name: string): Promise<Category>;
  moveCategory(id: string, direction: "up" | "down"): Promise<void>;
  deleteCategory(id: string, reassignTo?: string): Promise<void>;
  updateSettings(input: SettingsWriteInput): Promise<StoreSettings>;
  importProducts(rows: ImportRow[]): Promise<{ created: number; updated: number }>;
  listProductsForImport(): Promise<Pick<Product, "id" | "sku">[]>;
}
