import Link from "next/link";
import { ArrowDown, ArrowUpRight, MessageCircle } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { brandConfig } from "@/config/brand";
import { whatsappLink } from "@/lib/format";
import { getRepo } from "@/lib/repo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ categoria?: string | string[] }>;

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const categorySlug = Array.isArray(params.categoria) ? params.categoria[0] : params.categoria;

  const repo = getRepo();
  const [settings, categories, allProducts] = await Promise.all([
    repo.getSettings(),
    repo.listCategories(),
    repo.listPublishedProducts(),
  ]);

  const activeCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug)
    : undefined;
  const products = activeCategory
    ? allProducts.filter((product) => product.categoryId === activeCategory.id)
    : allProducts;

  const heroProducts = allProducts.filter((product) => product.images.length > 0).slice(0, 3);
  const generalMessage = `Hola ${settings.storeName}! Quiero hacer una consulta sobre el catálogo.`;

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(233,221,255,0.85),transparent_68%)]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-9 sm:px-6 lg:pb-16 lg:pt-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.04fr_0.96fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
                Importación seleccionada
              </span>

              <h1 className="mt-5 text-balance text-[38px] font-extrabold leading-[1.02] tracking-[-0.055em] sm:text-[52px] lg:text-[58px]">
                Tecnología que vale la pena importar.
              </h1>
              <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                {brandConfig.description}
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <a
                  href={whatsappLink(settings.whatsapp, generalMessage)}
                  target="_blank"
                  rel="noreferrer"
                  className="brand-button inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold"
                >
                  <MessageCircle className="h-4 w-4" />
                  Consultar por WhatsApp
                </a>
                <a
                  href="#catalogo"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink/10 bg-white px-5 text-[13px] font-semibold transition-colors hover:bg-white/70"
                >
                  Ver catálogo
                  <ArrowDown className="h-4 w-4" />
                </a>
              </div>

              <p className="mt-4 text-[11px] text-muted-foreground">
                Atención personalizada · Envíos a todo el país
              </p>
            </div>

            {heroProducts.length > 0 ? (
              <div className="relative hidden lg:block">
                <div className="pointer-events-none absolute -left-8 top-12 h-40 w-40 rounded-full bg-lilac/70 blur-2xl" />
                <div className="relative mx-auto max-w-[430px] rounded-[32px] border border-white/80 bg-white/55 p-3 ring-1 ring-ink/[0.04] backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`/producto/${heroProducts[0].slug}`}
                      className="col-span-2 aspect-[4/3] overflow-hidden rounded-2xl bg-lilac"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroProducts[0].images[0].url}
                        alt={heroProducts[0].images[0].alt ?? heroProducts[0].name}
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    {heroProducts.slice(1, 3).map((product) => (
                      <Link
                        key={product.id}
                        href={`/producto/${product.slug}`}
                        className="aspect-square overflow-hidden rounded-2xl bg-lilac"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].alt ?? product.name}
                          className="h-full w-full object-cover"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-6xl scroll-mt-24 px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/[0.08] pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Catálogo
            </p>
            <h2 className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] sm:text-[28px]">
              {activeCategory ? activeCategory.name : "Todos los productos"}
            </h2>
          </div>
          <p className="text-[11.5px] font-medium text-muted-foreground">
            {products.length} producto{products.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/#catalogo"
            className={cn(
              "shrink-0 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors",
              !activeCategory
                ? "bg-[var(--brand)] text-ink"
                : "border border-ink/10 bg-white/70 text-ink/60 hover:text-ink",
            )}
          >
            Todo
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/?categoria=${encodeURIComponent(category.slug)}#catalogo`}
              className={cn(
                "shrink-0 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors",
                activeCategory?.id === category.id
                  ? "bg-[var(--brand)] text-ink"
                  : "border border-ink/10 bg-white/70 text-ink/60 hover:text-ink",
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>

        {products.length > 0 ? (
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                settings={settings}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-ink/10 bg-white/60 px-6 py-16 text-center">
            <h3 className="text-[18px] font-bold">No hay productos en esta categoría</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              Estamos actualizando el catálogo. Escribinos y te contamos qué tenemos disponible.
            </p>
            <a
              href={whatsappLink(settings.whatsapp, generalMessage)}
              target="_blank"
              rel="noreferrer"
              className="brand-button mt-5 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[12.5px] font-semibold"
            >
              <MessageCircle className="h-4 w-4" />
              Consultar disponibilidad
            </a>
          </div>
        )}
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink px-6 py-9 sm:flex-row sm:items-center sm:px-10">
          <div>
            <h2 className="text-[24px] font-extrabold tracking-[-0.03em] text-white sm:text-[28px]">
              ¿No encontrás lo que buscás?
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/50">
              Contanos qué necesitás. Importamos productos seleccionados y te asesoramos antes de
              comprar.
            </p>
          </div>
          <a
            href={whatsappLink(settings.whatsapp, generalMessage)}
            target="_blank"
            rel="noreferrer"
            className="brand-button inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold"
          >
            Hablar por WhatsApp
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
