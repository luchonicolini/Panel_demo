export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

export const STATUS_DESCRIPTIONS: Record<ProductStatus, string> = {
  draft: "Solo visible en el panel. Podés publicarlo cuando esté listo.",
  published: "Visible en la tienda pública y disponible para consultar.",
  archived: "Fuera de la tienda. Podés recuperarlo como borrador.",
};

export type ProductImage = {
  id: string;
  url: string;
  storagePath: string | null;
  alt: string | null;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  categoryId: string | null;
  categoryName: string | null;
  price: number;
  stock: number;
  status: ProductStatus;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
};

export type StoreSettings = {
  storeName: string;
  logoUrl: string | null;
  brandColor: string;
  whatsapp: string;
  lowStockThreshold: number;
  currency: string;
  locale: string;
};

export type ProductFilters = {
  status?: ProductStatus | "all";
  categoryId?: string;
  q?: string;
};

export type ProductCounts = {
  all: number;
  draft: number;
  published: number;
  archived: number;
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type ImportRowStatus = "create" | "update" | "error";

export type ImportRow = {
  line: number;
  status: ImportRowStatus;
  sku: string;
  name: string;
  categoryName: string;
  price: number | null;
  stock: number | null;
  productStatus: ProductStatus | null;
  errors: string[];
  raw: Record<string, string>;
};

export type ImportPreview = {
  rows: ImportRow[];
  createCount: number;
  updateCount: number;
  errorCount: number;
  canApply: boolean;
  fatalError?: string;
};
