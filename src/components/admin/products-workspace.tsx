"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  ImageOff,
  Loader2,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ImportDialog } from "@/components/admin/import-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  changeProductStatusAction,
  duplicateProductAction,
  quickUpdateProductAction,
} from "@/lib/actions/products";
import { formatCurrency, formatPriceInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  Category,
  Product,
  ProductCounts,
  ProductStatus,
  StoreSettings,
} from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

type Filters = {
  status: ProductStatus | "all";
  q: string;
  categoryId: string;
};

type WorkspaceProps = {
  products: Product[];
  counts: ProductCounts;
  categories: Category[];
  lowStock: Product[];
  settings: StoreSettings;
  filters: Filters;
  saved?: string;
};

const statusTabs: Array<{ value: ProductStatus | "all"; label: string; icon: typeof Check }> = [
  { value: "all", label: "Todos", icon: Package },
  { value: "published", label: "Publicados", icon: CheckCircle2 },
  { value: "draft", label: "Borradores", icon: Pencil },
  { value: "archived", label: "Archivados", icon: Archive },
];

function catalogUrl(filters: Filters, overrides: Partial<Filters> = {}) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (next.status !== "all") params.set("status", next.status);
  if (next.q.trim()) params.set("q", next.q.trim());
  if (next.categoryId) params.set("categoria", next.categoryId);
  const query = params.toString();
  return `/admin/productos${query ? `?${query}` : ""}`;
}

export function ProductsWorkspace({
  products,
  counts,
  categories,
  lowStock,
  settings,
  filters,
  saved,
}: WorkspaceProps) {
  const router = useRouter();
  const [search, setSearch] = useState(filters.q);
  const [searchPending, startSearchTransition] = useTransition();
  const [selected, setSelected] = useState<Product | null>(lowStock[0] ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const flashShown = useRef(false);

  useEffect(() => {
    setSearch(filters.q);
  }, [filters.q]);

  useEffect(() => {
    if (!saved || flashShown.current) return;
    flashShown.current = true;
    toast.success(saved === "creado" ? "Producto creado." : "Producto actualizado.");
    const params = new URLSearchParams(window.location.search);
    params.delete("saved");
    const query = params.toString();
    router.replace(`/admin/productos${query ? `?${query}` : ""}`, { scroll: false });
  }, [saved, router]);

  useEffect(() => {
    if (search.trim() === filters.q) return;
    const timer = setTimeout(() => {
      startSearchTransition(() => {
        router.replace(catalogUrl(filters, { q: search }), { scroll: false });
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [search, filters, router]);

  function selectProduct(product: Product) {
    setSelected(product);
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 1280px)").matches) {
      setSheetOpen(true);
    }
  }

  async function handleStatus(product: Product, status: ProductStatus) {
    setBusyId(product.id);
    try {
      const result = await changeProductStatusAction(product.id, status);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (status === "archived") {
        toast.success("Producto archivado. Ya no aparece en la tienda.");
        if (selected?.id === product.id) setSelected(null);
      } else if (status === "published") {
        toast.success("Producto publicado en la tienda.");
        if (selected?.id === product.id) setSelected(result.product);
      } else {
        toast.success("Producto recuperado como borrador.");
        if (selected?.id === product.id) setSelected(result.product);
      }
      router.refresh();
    } catch {
      toast.error("No pudimos cambiar el estado. Intentá de nuevo.");
    } finally {
      setBusyId(null);
      setArchiveTarget(null);
    }
  }

  async function handleDuplicate(product: Product) {
    setBusyId(product.id);
    try {
      const result = await duplicateProductAction(product.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Copia creada como borrador.");
      router.refresh();
    } catch {
      toast.error("No pudimos duplicar el producto.");
    } finally {
      setBusyId(null);
    }
  }

  function requestArchive(product: Product) {
    setArchiveTarget(product);
  }

  const activeFilters = filters.q || filters.categoryId || filters.status !== "all";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Catálogo
          </p>
          <h1 className="mt-1.5 text-[32px] font-extrabold leading-none tracking-[-0.045em] sm:text-[38px]">
            Productos
          </h1>
        </div>
        <Button asChild size="lg" className="h-11 rounded-xl px-4 sm:px-5">
          <Link href="/admin/productos/nuevo">
            <Plus className="h-5 w-5" strokeWidth={2.6} />
            Nuevo producto
          </Link>
        </Button>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_336px] 2xl:grid-cols-[minmax(0,1fr)_356px]">
        <div className="min-w-0 space-y-4">
          <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-border/60 bg-white p-1.5">
            {statusTabs.map((tab) => {
              const active = filters.status === tab.value;
              const Icon = tab.icon;
              const count =
                tab.value === "all" ? counts.all : counts[tab.value as ProductStatus];
              return (
                <Link
                  key={tab.value}
                  href={catalogUrl(filters, { status: tab.value })}
                  scroll={false}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-colors sm:px-4",
                    active ? "bg-[var(--brand)] text-ink" : "text-ink/60 hover:bg-muted hover:text-ink",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.4 : 1.9} />
                  {tab.label}
                  <span className={cn("text-[11px] tabular-nums", active ? "text-ink/55" : "text-ink/35")}>
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o SKU"
                aria-label="Buscar por nombre o SKU"
                className="h-11 pl-10 pr-10"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink/40 hover:bg-muted hover:text-ink"
                  aria-label="Limpiar búsqueda"
                >
                  {searchPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                </button>
              ) : null}
            </div>

            <div className="flex gap-2.5">
              <Select
                value={filters.categoryId || "all"}
                onValueChange={(value) => {
                  startSearchTransition(() => {
                    router.replace(catalogUrl(filters, { categoryId: value === "all" ? "" : value }), {
                      scroll: false,
                    });
                  });
                }}
              >
                <SelectTrigger className="h-11 min-w-0 flex-1 sm:w-[200px]" aria-label="Filtrar por categoría">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ImportDialog onImported={() => router.refresh()} />
            </div>
          </div>

          {activeFilters ? (
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
              <span>
                {products.length} resultado{products.length === 1 ? "" : "s"}
              </span>
              <span className="text-ink/20">·</span>
              <Link
                href="/admin/productos"
                scroll={false}
                className="font-semibold text-ink underline-offset-4 hover:underline"
              >
                Limpiar filtros
              </Link>
            </div>
          ) : null}

          <MobileLowStock products={lowStock} threshold={settings.lowStockThreshold} onSelect={selectProduct} />

          <ProductList
            products={products}
            settings={settings}
            busyId={busyId}
            onSelect={selectProduct}
            onStatus={handleStatus}
            onDuplicate={handleDuplicate}
            onArchive={requestArchive}
            activeFilters={Boolean(activeFilters)}
          />
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-5">
            <LowStockPanel
              products={lowStock}
              threshold={settings.lowStockThreshold}
              onSelect={selectProduct}
              selectedId={selected?.id}
            />
            <QuickEditPanel
              product={selected}
              settings={settings}
              onSaved={(product) => setSelected(product)}
            />
          </div>
        </aside>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/10" />
          <SheetTitle className="sr-only">Edición rápida</SheetTitle>
          <QuickEditPanel
            product={selected}
            settings={settings}
            mobile
            onSaved={(product) => setSelected(product)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(archiveTarget)} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <SheetContent side="bottom" className="px-5 pb-8 pt-2">
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-ink/10" />
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-peach">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Archivar producto</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-ink">{archiveTarget?.name}</span> dejará de
                aparecer en la tienda. Podés recuperarlo como borrador cuando quieras.
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setArchiveTarget(null)}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={busyId === archiveTarget?.id}
              onClick={() => archiveTarget && handleStatus(archiveTarget, "archived")}
            >
              {busyId === archiveTarget?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
              Archivar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProductList({
  products,
  settings,
  busyId,
  onSelect,
  onStatus,
  onDuplicate,
  onArchive,
  activeFilters,
}: {
  products: Product[];
  settings: StoreSettings;
  busyId: string | null;
  onSelect: (product: Product) => void;
  onStatus: (product: Product, status: ProductStatus) => void;
  onDuplicate: (product: Product) => void;
  onArchive: (product: Product) => void;
  activeFilters: boolean;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-white/60 px-6 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-lilac">
          <Package className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold">
          {activeFilters ? "No encontramos productos" : "Todavía no hay productos"}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {activeFilters
            ? "Probá con otra búsqueda, categoría o estado."
            : "Creá el primero y empezá a armar el catálogo de la tienda."}
        </p>
        <Button asChild className="mt-5">
          <Link href="/admin/productos/nuevo">
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-white">
      <div className="hidden grid-cols-[minmax(0,1fr)_104px_82px_122px_40px] gap-3 border-b border-border/60 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground md:grid">
        <span>Producto</span>
        <span>Precio</span>
        <span>Stock</span>
        <span>Estado</span>
        <span className="sr-only">Acciones</span>
      </div>

      <div className="divide-y divide-border/50">
        {products.map((product) => {
          const low = product.stock < settings.lowStockThreshold;
          const busy = busyId === product.id;

          return (
            <div
              key={product.id}
              className={cn(
                "group transition-colors hover:bg-muted/35",
                busy && "pointer-events-none opacity-60",
              )}
            >
              {/* Escritorio */}
              <div className="hidden grid-cols-[minmax(0,1fr)_104px_82px_122px_40px] items-center gap-3 px-5 py-3 md:grid">
                <button
                  type="button"
                  onClick={() => onSelect(product)}
                  className="flex min-w-0 items-center gap-3 text-left"
                  title="Seleccionar para edición rápida"
                >
                  <ProductThumb product={product} />
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold leading-snug">
                      {product.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {product.sku}
                      {product.categoryName ? ` · ${product.categoryName}` : ""}
                    </span>
                  </span>
                </button>

                <span className="text-[13px] font-semibold tabular-nums">
                  {formatCurrency(product.price, settings.currency, settings.locale)}
                </span>

                <StockPill stock={product.stock} low={low} />

                <StatusPill status={product.status} />

                <ProductMenu
                  product={product}
                  onStatus={onStatus}
                  onDuplicate={onDuplicate}
                  onArchive={onArchive}
                />
              </div>

              {/* Celular */}
              <div className="flex gap-3 p-4 md:hidden">
                <button
                  type="button"
                  onClick={() => onSelect(product)}
                  className="shrink-0"
                  aria-label={`Seleccionar ${product.name}`}
                >
                  <ProductThumb product={product} className="h-16 w-16" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect(product)}
                      className="min-w-0 text-left"
                    >
                      <span className="block text-[14px] font-semibold leading-snug">{product.name}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {product.sku}
                        {product.categoryName ? ` · ${product.categoryName}` : ""}
                      </span>
                    </button>
                    <ProductMenu
                      product={product}
                      onStatus={onStatus}
                      onDuplicate={onDuplicate}
                      onArchive={onArchive}
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-[15px] font-bold tabular-nums">
                      {formatCurrency(product.price, settings.currency, settings.locale)}
                    </span>
                    <StockPill stock={product.stock} low={low} />
                    <StatusPill status={product.status} />
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelect(product)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink/70 underline-offset-4 hover:text-ink hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar precio y stock
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductThumb({ product, className }: { product: Product; className?: string }) {
  const image = product.images[0];
  return (
    <span
      className={cn(
        "grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-lilac",
        className,
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt={image.alt ?? product.name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <ImageOff className="h-5 w-5 text-ink/30" />
      )}
    </span>
  );
}

function StockPill({ stock, low }: { stock: number; low: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-fit items-center justify-center rounded-lg px-2.5 text-[12px] font-semibold tabular-nums",
        low ? "bg-peach text-ink" : "bg-brand-soft text-ink",
      )}
    >
      {stock} u.
    </span>
  );
}

function StatusPill({ status }: { status: ProductStatus }) {
  const Icon = status === "published" ? Check : status === "draft" ? Pencil : Archive;
  return (
    <span
      className={cn(
        "inline-flex h-7 w-fit items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold",
        status === "published" && "bg-brand-soft text-ink",
        status === "draft" && "bg-lilac text-ink",
        status === "archived" && "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {STATUS_LABELS[status]}
    </span>
  );
}

function ProductMenu({
  product,
  onStatus,
  onDuplicate,
  onArchive,
}: {
  product: Product;
  onStatus: (product: Product, status: ProductStatus) => void;
  onDuplicate: (product: Product) => void;
  onArchive: (product: Product) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto text-ink/50"
          aria-label={`Acciones para ${product.name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Producto</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/admin/productos/${product.id}`}>
            <Pencil />
            Editar ficha
          </Link>
        </DropdownMenuItem>
        {product.status === "published" ? (
          <DropdownMenuItem asChild>
            <Link href={`/producto/${product.slug}`} target="_blank">
              <ExternalLink />
              Ver en la tienda
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={() => onDuplicate(product)}>
          <Copy />
          Duplicar como borrador
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {product.status === "draft" ? (
          <DropdownMenuItem onSelect={() => onStatus(product, "published")}>
            <Check />
            Publicar
          </DropdownMenuItem>
        ) : null}
        {product.status === "archived" ? (
          <DropdownMenuItem onSelect={() => onStatus(product, "draft")}>
            <ArchiveRestore />
            Recuperar como borrador
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onArchive(product)}>
            <Archive />
            Archivar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LowStockPanel({
  products,
  threshold,
  onSelect,
  selectedId,
}: {
  products: Product[];
  threshold: number;
  onSelect: (product: Product) => void;
  selectedId?: string;
}) {
  return (
    <section className="rounded-3xl bg-peach p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/70">
          <AlertTriangle className="h-5 w-5" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-[17px] font-bold leading-tight">Stock bajo</h2>
          <p className="mt-0.5 text-[12px] leading-snug text-ink/55">
            Publicados con menos de {threshold} unidades
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {products.length === 0 ? (
          <div className="rounded-2xl bg-white/60 px-4 py-5 text-center">
            <p className="text-[13px] font-semibold">Todo en orden</p>
            <p className="mt-0.5 text-[11px] text-ink/50">Ningún producto publicado necesita reposición.</p>
          </div>
        ) : (
          <div className="scrollbar-thin max-h-[300px] space-y-2 overflow-y-auto pr-0.5">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelect(product)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-left transition-all hover:bg-white/85",
                  selectedId === product.id && "ring-2 ring-ink/15",
                )}
              >
                <ProductThumb product={product} className="h-12 w-12 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold leading-snug">{product.name}</span>
                  <span className="mt-0.5 block text-[10.5px] text-muted-foreground">{product.sku}</span>
                </span>
                <span className="shrink-0 rounded-lg bg-peach px-2 py-1 text-[11px] font-bold tabular-nums">
                  {product.stock} u.
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {products.length > 0 ? (
        <p className="mt-3 text-[10.5px] leading-snug text-ink/45">
          Tocá un producto para abrirlo en Edición rápida.
        </p>
      ) : null}
    </section>
  );
}

function MobileLowStock({
  products,
  threshold,
  onSelect,
}: {
  products: Product[];
  threshold: number;
  onSelect: (product: Product) => void;
}) {
  if (products.length === 0) return null;

  return (
    <section className="rounded-2xl bg-peach p-3 xl:hidden">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="flex items-center gap-1.5 text-[12px] font-bold">
          <AlertTriangle className="h-3.5 w-3.5" />
          Stock bajo
        </h2>
        <span className="text-[10px] text-ink/50">Menos de {threshold} u.</span>
      </div>
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product)}
            className="flex min-w-[178px] items-center gap-2 rounded-xl bg-white p-2 text-left"
          >
            <ProductThumb product={product} className="h-9 w-9 rounded-lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold">{product.name}</span>
              <span className="text-[10px] font-semibold text-ink/50">{product.stock} u.</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function QuickEditPanel({
  product,
  settings,
  onSaved,
  mobile = false,
}: {
  product: Product | null;
  settings: StoreSettings;
  onSaved: (product: Product) => void;
  mobile?: boolean;
}) {
  return (
    <section className={cn("rounded-3xl bg-lilac p-5", mobile && "rounded-none bg-transparent p-0")}>
      {!mobile ? (
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/60">
            <Pencil className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[17px] font-bold leading-tight">Edición rápida</h2>
            <p className="mt-0.5 text-[12px] leading-snug text-ink/55">
              Modificá precio y stock del producto seleccionado.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-[20px] font-bold leading-tight">Edición rápida</h2>
          <p className="mt-0.5 text-[12px] text-ink/55">Precio y stock sin salir del catálogo.</p>
        </div>
      )}

      <div className={cn(!mobile && "mt-4")}>
        {product ? (
          <QuickEditForm key={product.id} product={product} settings={settings} onSaved={onSaved} />
        ) : (
          <div className="rounded-2xl bg-white/55 px-4 py-7 text-center">
            <Pencil className="mx-auto h-5 w-5 text-ink/35" />
            <p className="mt-2 text-[13px] font-semibold">Elegí un producto</p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink/50">
              Seleccioná una fila del catálogo o un producto con stock bajo.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function QuickEditForm({
  product,
  settings,
  onSaved,
}: {
  product: Product;
  settings: StoreSettings;
  onSaved: (product: Product) => void;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(formatPriceInput(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!price.trim()) {
      setFeedback({ type: "error", text: "Ingresá un precio." });
      return;
    }
    if (stock.trim() === "" || Number(stock) < 0 || !Number.isInteger(Number(stock))) {
      setFeedback({ type: "error", text: "Ingresá un stock entero mayor o igual a 0." });
      return;
    }

    setPending(true);
    try {
      const result = await quickUpdateProductAction({
        id: product.id,
        price,
        stock,
      });
      if (!result.ok) {
        setFeedback({ type: "error", text: result.error });
        toast.error(result.error);
        return;
      }
      setFeedback({ type: "success", text: "Cambios guardados." });
      toast.success("Precio y stock actualizados.");
      onSaved(result.product);
      router.refresh();
    } catch {
      setFeedback({ type: "error", text: "No pudimos guardar. Intentá de nuevo." });
      toast.error("No pudimos guardar. Intentá de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl bg-white p-2.5">
        <ProductThumb product={product} className="h-[52px] w-[52px] rounded-lg" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-[13px] font-semibold leading-snug">{product.name}</p>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">{product.sku}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor={`quick-price-${product.id}`} className="text-[12px]">
            Precio ({settings.currency})
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-medium text-ink/45">
              $
            </span>
            <Input
              id={`quick-price-${product.id}`}
              value={price}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 9);
                setPrice(digits ? formatPriceInput(Number(digits)) : "");
              }}
              inputMode="numeric"
              autoComplete="off"
              className="h-12 border-ink/10 bg-white pl-8 text-[16px] font-semibold tabular-nums"
              aria-label="Precio"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`quick-stock-${product.id}`} className="text-[12px]">
            Stock
          </Label>
          <Input
            id={`quick-stock-${product.id}`}
            value={stock}
            onChange={(event) => setStock(event.target.value.replace(/[^\d]/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="off"
            className="h-12 border-ink/10 bg-white text-[16px] font-semibold tabular-nums"
            aria-label="Stock"
          />
        </div>

        {feedback ? (
          <p
            role="status"
            className={cn(
              "flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[11.5px] font-medium leading-snug",
              feedback.type === "success" ? "bg-white/60 text-ink" : "bg-white text-destructive",
            )}
          >
            {feedback.type === "success" ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            {feedback.text}
          </p>
        ) : null}

        <Button type="submit" className="h-12 w-full text-[14px]" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.6} />}
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>

        <Link
          href={`/admin/productos/${product.id}`}
          className="flex items-center justify-center gap-1 text-[11.5px] font-semibold text-ink/55 underline-offset-4 hover:text-ink hover:underline"
        >
          Abrir ficha completa
          <ExternalLink className="h-3 w-3" />
        </Link>
      </form>
    </div>
  );
}
