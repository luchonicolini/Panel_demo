import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Product, StoreSettings } from "@/lib/types";

export function ProductCard({
  product,
  settings,
  priority = false,
}: {
  product: Product;
  settings: StoreSettings;
  priority?: boolean;
}) {
  const image = product.images[0];
  const soldOut = product.stock === 0;

  return (
    <Link href={`/producto/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-lilac">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt ?? product.name}
            loading={priority ? "eager" : "lazy"}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] ${
              soldOut ? "opacity-55 saturate-[0.7]" : ""
            }`}
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <ImageOff className="h-7 w-7 text-ink/25" />
          </div>
        )}

        {soldOut ? (
          <span className="absolute left-2.5 top-2.5 rounded-lg bg-white/95 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-ink">
            Agotado
          </span>
        ) : null}
      </div>

      <div className="mt-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
          {product.categoryName ?? "Catálogo"}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink">
          {product.name}
        </h3>
        <p className="mt-1.5 text-[14px] font-bold tabular-nums">
          {formatCurrency(product.price, settings.currency, settings.locale)}
        </p>
      </div>
    </Link>
  );
}
