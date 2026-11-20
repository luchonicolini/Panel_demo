import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, MessageCircle } from "lucide-react";
import { ProductGallery } from "@/components/store/product-gallery";
import { formatCurrency } from "@/lib/format";
import { whatsappLink } from "@/lib/format";
import { getRepo } from "@/lib/repo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getRepo().getPublishedProductBySlug(slug);
  if (!product) return { title: "Producto no disponible" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const repo = getRepo();
  const [product, settings] = await Promise.all([
    repo.getPublishedProductBySlug(slug),
    repo.getSettings(),
  ]);

  if (!product) notFound();

  const soldOut = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock < settings.lowStockThreshold;
  const message = soldOut
    ? `Hola ${settings.storeName}! Quiero consultar disponibilidad de ${product.name} (${product.sku}).`
    : `Hola ${settings.storeName}! Me interesa ${product.name} (${product.sku}). ¿Está disponible?`;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:pt-10">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground" aria-label="Migas de pan">
        <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" />
          Catálogo
        </Link>
        <span className="text-ink/20">/</span>
        <span className="truncate text-ink/70">{product.name}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:pt-2">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {product.categoryName ?? "Catálogo"}
          </p>
          <h1 className="mt-2 text-balance text-[30px] font-extrabold leading-[1.08] tracking-[-0.045em] sm:text-[38px]">
            {product.name}
          </h1>
          <p className="mt-2 text-[11.5px] font-medium text-muted-foreground">SKU {product.sku}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="text-[28px] font-extrabold tracking-tight tabular-nums">
              {formatCurrency(product.price, settings.currency, settings.locale)}
            </p>
            <span
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold",
                soldOut && "bg-peach text-ink",
                lowStock && "bg-peach text-ink",
                !soldOut && !lowStock && "bg-brand-soft text-ink",
              )}
            >
              {soldOut ? null : <Check className="h-3.5 w-3.5" />}
              {soldOut ? "Agotado" : lowStock ? "Últimas unidades" : "Disponible"}
            </span>
          </div>

          {product.description ? (
            <p className="mt-6 whitespace-pre-line text-[14px] leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          <a
            href={whatsappLink(settings.whatsapp, message)}
            target="_blank"
            rel="noreferrer"
            className="brand-button mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-semibold"
          >
            <MessageCircle className="h-4 w-4" />
            {soldOut ? "Consultar disponibilidad" : "Consultar por WhatsApp"}
            <ArrowUpRight className="h-4 w-4" />
          </a>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            Coordinamos pago y entrega por WhatsApp. Sin carrito ni checkout.
          </p>

          <div className="mt-8 rounded-2xl border border-ink/[0.07] bg-white/60 px-4 py-3.5">
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-ink">¿Tenés una consulta?</span> Escribinos con el
              nombre del producto y te respondemos con stock, tiempos de entrega y formas de pago.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
