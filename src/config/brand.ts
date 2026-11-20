/**
 * Configuración de marca del starter.
 *
 * Para clonar el proyecto para otro cliente:
 *   1. Editá los valores de `brandConfig`.
 *   2. Reemplazá las imágenes de /public/brand y /public/products.
 *   3. Configurá un proyecto de Supabase propio y corré las migraciones.
 *
 * Los valores de la tabla `site_settings` pisan estos defaults en runtime,
 * así el dueño de la tienda puede cambiar nombre, logo, color, WhatsApp y
 * umbral de stock sin tocar código. Este archivo es la fuente de verdad
 * inicial y el fallback si la base todavía no tiene configuración.
 */
export const brandConfig = {
  name: "Nicolini Import",
  shortName: "Nicolini",
  monogram: "Ni",
  tagline: "Tecnología importada, seleccionada a mano.",
  description:
    "Auriculares, teclados, parlantes y accesorios elegidos uno por uno. Comprá por WhatsApp y coordinamos la entrega.",
  /** Logo opcional. Si es null se usa el monograma de la marca. */
  logoUrl: null as string | null,
  /** Color de acción principal. Debe ser un hex de 6 dígitos. */
  brandColor: "#c9f26b",
  /** Número en formato internacional, solo dígitos (54 9 11 ...). */
  whatsapp: "5491100000000",
  whatsappDisplay: "+54 9 11 0000-0000",
  lowStockThreshold: 10,
  currency: "ARS",
  locale: "es-AR",
  email: "hola@nicoliniimport.com",
  instagram: "@nicoliniimport",
  /** Texto libre para el pie de la tienda. */
  footerNote: "Venta por WhatsApp. Coordinamos envíos a todo el país.",
} as const;

export type BrandConfig = typeof brandConfig;

export const defaultSettings = {
  storeName: brandConfig.name,
  logoUrl: brandConfig.logoUrl,
  brandColor: brandConfig.brandColor,
  whatsapp: brandConfig.whatsapp,
  lowStockThreshold: brandConfig.lowStockThreshold,
  currency: brandConfig.currency,
  locale: brandConfig.locale,
};

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
