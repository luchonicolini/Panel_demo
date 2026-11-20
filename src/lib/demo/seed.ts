import { defaultSettings } from "@/config/brand";
import type { ProductStatus, StoreSettings } from "@/lib/types";

export type DemoImage = {
  id: string;
  url: string;
  storagePath: string | null;
  alt: string | null;
  sortOrder: number;
};

export type DemoProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  categoryId: string;
  price: number;
  stock: number;
  status: ProductStatus;
  images: DemoImage[];
  createdAt: string;
  updatedAt: string;
};

export type DemoCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
};

export type DemoDb = {
  categories: DemoCategory[];
  products: DemoProduct[];
  settings: StoreSettings;
};

const categoryIds = {
  auriculares: "a1000000-0000-4000-8000-000000000001",
  teclados: "a1000000-0000-4000-8000-000000000002",
  parlantes: "a1000000-0000-4000-8000-000000000003",
  mouse: "a1000000-0000-4000-8000-000000000004",
  accesorios: "a1000000-0000-4000-8000-000000000005",
};

const categories: DemoCategory[] = [
  { id: categoryIds.auriculares, name: "Auriculares", slug: "auriculares", sortOrder: 0, createdAt: "2026-10-01T10:00:00.000Z" },
  { id: categoryIds.teclados, name: "Teclados", slug: "teclados", sortOrder: 1, createdAt: "2026-10-01T10:01:00.000Z" },
  { id: categoryIds.parlantes, name: "Parlantes", slug: "parlantes", sortOrder: 2, createdAt: "2026-10-01T10:02:00.000Z" },
  { id: categoryIds.mouse, name: "Mouse", slug: "mouse", sortOrder: 3, createdAt: "2026-10-01T10:03:00.000Z" },
  { id: categoryIds.accesorios, name: "Accesorios", slug: "accesorios", sortOrder: 4, createdAt: "2026-10-01T10:04:00.000Z" },
];

function image(id: string, url: string, alt: string): DemoImage {
  return { id, url, storagePath: null, alt, sortOrder: 0 };
}

const products: DemoProduct[] = [
  {
    id: "b1000000-0000-4000-8000-000000000001",
    name: "Auriculares inalámbricos Pro",
    slug: "auriculares-inalambricos-pro",
    description:
      "Auriculares over-ear con cancelación activa de ruido, hasta 40 horas de batería y estuche rígido de viaje. Ideales para trabajo, estudio y viajes largos.",
    sku: "NI-AUR-001",
    categoryId: categoryIds.auriculares,
    price: 129900,
    stock: 6,
    status: "published",
    images: [image("c1000000-0000-4000-8000-000000000001", "/products/auriculares.svg", "Auriculares inalámbricos Pro")],
    createdAt: "2026-11-18T13:20:00.000Z",
    updatedAt: "2026-11-18T13:20:00.000Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000002",
    name: "Teclado mecánico RGB",
    slug: "teclado-mecanico-rgb",
    description:
      "Teclado mecánico compacto con switches táctiles, iluminación RGB configurable y estructura de aluminio. Incluye cable USB-C desmontable.",
    sku: "NI-TEC-008",
    categoryId: categoryIds.teclados,
    price: 89900,
    stock: 14,
    status: "published",
    images: [image("c1000000-0000-4000-8000-000000000002", "/products/teclado.svg", "Teclado mecánico RGB")],
    createdAt: "2026-11-17T11:05:00.000Z",
    updatedAt: "2026-11-17T11:05:00.000Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000003",
    name: "Parlante portátil Bluetooth",
    slug: "parlante-portatil-bluetooth",
    description:
      "Parlante resistente al agua con sonido estéreo, correa de transporte y 18 horas de reproducción. Se conecta con dos dispositivos a la vez.",
    sku: "NI-PAR-004",
    categoryId: categoryIds.parlantes,
    price: 79900,
    stock: 4,
    status: "published",
    images: [image("c1000000-0000-4000-8000-000000000003", "/products/parlante.svg", "Parlante portátil Bluetooth")],
    createdAt: "2026-11-16T16:40:00.000Z",
    updatedAt: "2026-11-16T16:40:00.000Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000004",
    name: "Mouse inalámbrico ergonómico",
    slug: "mouse-inalambrico-ergonomico",
    description:
      "Mouse ergonómico con sensor silencioso, conexión inalámbrica 2.4 GHz y Bluetooth. Batería recargable de larga duración.",
    sku: "NI-MOU-003",
    categoryId: categoryIds.mouse,
    price: 24900,
    stock: 32,
    status: "published",
    images: [image("c1000000-0000-4000-8000-000000000004", "/products/mouse.svg", "Mouse inalámbrico ergonómico")],
    createdAt: "2026-11-15T09:15:00.000Z",
    updatedAt: "2026-11-15T09:15:00.000Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000005",
    name: "Hub USB-C 7 en 1",
    slug: "hub-usb-c-7-en-1",
    description:
      "Adaptador USB-C con HDMI 4K, lector SD, dos puertos USB 3.0 y carga rápida de 100 W. Compacto, ideal para notebook.",
    sku: "NI-ACC-011",
    categoryId: categoryIds.accesorios,
    price: 39900,
    stock: 0,
    status: "published",
    images: [image("c1000000-0000-4000-8000-000000000005", "/products/hub.svg", "Hub USB-C 7 en 1")],
    createdAt: "2026-11-14T15:30:00.000Z",
    updatedAt: "2026-11-14T15:30:00.000Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000006",
    name: "Soporte para notebook",
    slug: "soporte-para-notebook",
    description:
      "Soporte de aluminio regulable en altura, con base antideslizante y ventilación abierta. Compatible con notebooks de 11 a 17 pulgadas.",
    sku: "NI-ACC-012",
    categoryId: categoryIds.accesorios,
    price: 18900,
    stock: 22,
    status: "published",
    images: [image("c1000000-0000-4000-8000-000000000006", "/products/soporte.svg", "Soporte para notebook")],
    createdAt: "2026-11-13T12:10:00.000Z",
    updatedAt: "2026-11-13T12:10:00.000Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000007",
    name: "Auriculares inalámbricos Lite",
    slug: "auriculares-inalambricos-lite",
    description:
      "Versión liviana de nuestros auriculares inalámbricos. Batería de 24 horas y controles táctiles. Borrador pendiente de fotos finales.",
    sku: "NI-AUR-002",
    categoryId: categoryIds.auriculares,
    price: 59900,
    stock: 12,
    status: "draft",
    images: [image("c1000000-0000-4000-8000-000000000007", "/products/auriculares.svg", "Auriculares inalámbricos Lite")],
    createdAt: "2026-11-12T10:00:00.000Z",
    updatedAt: "2026-11-12T10:00:00.000Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000008",
    name: "Webcam Full HD",
    slug: "webcam-full-hd",
    description:
      "Cámara Full HD con micrófono integrado y corrección de luz. Producto descontinuado, archivado para referencia.",
    sku: "NI-ACC-013",
    categoryId: categoryIds.accesorios,
    price: 45900,
    stock: 0,
    status: "archived",
    images: [image("c1000000-0000-4000-8000-000000000008", "/products/webcam.svg", "Webcam Full HD")],
    createdAt: "2026-11-10T10:00:00.000Z",
    updatedAt: "2026-11-11T10:00:00.000Z",
  },
];

export const demoSeed: DemoDb = {
  categories,
  products,
  settings: { ...defaultSettings },
};
