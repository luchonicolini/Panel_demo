"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Check,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveProductAction, type ProductFormState } from "@/lib/actions/products";
import { formatCurrency, formatPriceInput } from "@/lib/format";
import { IMAGE_ACCEPT_ATTRIBUTE, validateImageFile } from "@/lib/image-rules";
import { cn } from "@/lib/utils";
import { STATUS_DESCRIPTIONS, STATUS_LABELS } from "@/lib/types";
import type { Category, Product, ProductImage, ProductStatus, StoreSettings } from "@/lib/types";

const MAX_IMAGES = 6;

type NewFile = { id: string; file: File; preview: string };

const statusOptions: Array<{ value: ProductStatus; icon: typeof Check }> = [
  { value: "draft", icon: Pencil },
  { value: "published", icon: Check },
  { value: "archived", icon: Archive },
];

export function ProductForm({
  product,
  categories,
  settings,
}: {
  product?: Product;
  categories: Category[];
  settings: StoreSettings;
}) {
  const [state, formAction, isPending] = useActionState<ProductFormState, FormData>(
    saveProductAction,
    null,
  );

  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "draft");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(product ? formatPriceInput(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [existingImages, setExistingImages] = useState<ProductImage[]>(product?.images ?? []);
  const [newFiles, setNewFiles] = useState<NewFile[]>([]);
  const filesRef = useRef<NewFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    filesRef.current = newFiles;
  }, [newFiles]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  const totalImages = existingImages.length + newFiles.length;

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const accepted: NewFile[] = [];

    for (const file of Array.from(fileList)) {
      if (existingImages.length + newFiles.length + accepted.length >= MAX_IMAGES) {
        toast.error(`Podés subir hasta ${MAX_IMAGES} fotos.`);
        break;
      }
      const error = validateImageFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) setNewFiles((current) => [...current, ...accepted]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeNewFile(id: string) {
    setNewFiles((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((item) => item.id !== id);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("existingImageIds", JSON.stringify(existingImages.map((image) => image.id)));
    newFiles.forEach((item) => formData.append("images", item.file));
    // useActionState exige que el dispatch se ejecute dentro de una transición.
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="id" value={product?.id ?? ""} />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/admin/productos"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a productos
          </Link>
          <h1 className="mt-2 text-[28px] font-extrabold leading-none tracking-[-0.04em] sm:text-[34px]">
            {product ? "Editar producto" : "Nuevo producto"}
          </h1>
          {product ? (
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              {product.sku} · {STATUS_LABELS[product.status]}
            </p>
          ) : (
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Completá la ficha y guardá como borrador para revisarlo antes de publicar.
            </p>
          )}
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href="/admin/productos">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isPending || categories.length === 0} className="flex-1 sm:flex-none">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isPending ? "Guardando…" : "Guardar producto"}
          </Button>
        </div>
      </header>

      {state?.error ? (
        <div role="alert" className="flex items-start gap-2 rounded-2xl bg-peach px-4 py-3 text-[13px] font-medium">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {categories.length === 0 ? (
        <div className="flex items-start gap-2 rounded-2xl bg-peach px-4 py-3 text-[13px]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Necesitás al menos una categoría para guardar productos.{" "}
            <Link href="/admin/categorias" className="font-semibold underline underline-offset-4">
              Crear categoría
            </Link>
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Section
            title="Información"
            description="Es lo que ve el comprador en el catálogo y en la ficha."
          >
            <Field label="Nombre" htmlFor="name" error={state?.fieldErrors?.name?.[0]}>
              <Input
                id="name"
                name="name"
                defaultValue={product?.name ?? ""}
                placeholder="Ej.: Auriculares inalámbricos Pro"
                maxLength={120}
                required
                autoFocus={!product}
              />
            </Field>

            <Field
              label="Descripción"
              htmlFor="description"
              error={state?.fieldErrors?.description?.[0]}
              hint="Opcional. Contá materiales, medidas o qué incluye."
            >
              <Textarea
                id="description"
                name="description"
                defaultValue={product?.description ?? ""}
                placeholder="Describí el producto en pocas líneas."
                maxLength={5000}
                rows={6}
              />
            </Field>
          </Section>

          <Section
            title="Catálogo"
            description="El SKU identifica el producto en la tienda y en las importaciones."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SKU" htmlFor="sku" error={state?.fieldErrors?.sku?.[0]}>
                <Input
                  id="sku"
                  name="sku"
                  defaultValue={product?.sku ?? ""}
                  placeholder="NI-AUR-001"
                  maxLength={40}
                  required
                  className="font-mono uppercase"
                  onChange={(event) => {
                    event.target.value = event.target.value.toUpperCase();
                  }}
                />
              </Field>

              <Field label="Categoría" htmlFor="category" error={state?.fieldErrors?.categoryId?.[0]}>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category" aria-label="Categoría">
                    <SelectValue placeholder="Elegí una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="categoryId" value={categoryId} />
              </Field>
            </div>
          </Section>

          <Section
            title="Fotos"
            description="La primera imagen se usa como portada del producto."
          >
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {existingImages.map((image, index) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-lilac"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt ?? product?.name ?? "Foto del producto"}
                    className="h-full w-full object-cover"
                  />
                  {index === 0 ? <CoverTag /> : null}
                  <button
                    type="button"
                    onClick={() => setExistingImages((current) => current.filter((item) => item.id !== image.id))}
                    className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-ink shadow-sm transition hover:bg-white"
                    aria-label="Quitar foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {newFiles.map((item, index) => (
                <div
                  key={item.id}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-lilac"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.preview} alt="Foto nueva" className="h-full w-full object-cover" />
                  {existingImages.length === 0 && index === 0 ? <CoverTag /> : null}
                  <button
                    type="button"
                    onClick={() => removeNewFile(item.id)}
                    className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-ink shadow-sm transition hover:bg-white"
                    aria-label="Quitar foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {totalImages < MAX_IMAGES ? (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink/15 bg-muted/40 text-center transition-colors hover:bg-muted/80">
                  <ImagePlus className="h-5 w-5 text-ink/45" />
                  <span className="text-[10.5px] font-semibold text-ink/60">Agregar foto</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={IMAGE_ACCEPT_ATTRIBUTE}
                    multiple
                    className="sr-only"
                    onChange={(event) => handleFiles(event.target.files)}
                  />
                </label>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground">
              JPG, PNG, WebP o AVIF · hasta 5 MB por imagen · máximo {MAX_IMAGES} fotos.
            </p>
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Precio y stock" description="Se actualiza en la tienda al guardar.">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={`Precio (${settings.currency})`}
                htmlFor="price"
                error={state?.fieldErrors?.price?.[0]}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink/45">
                    $
                  </span>
                  <Input
                    id="price"
                    name="price"
                    value={price}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "").slice(0, 9);
                      setPrice(digits ? formatPriceInput(Number(digits)) : "");
                    }}
                    placeholder="0"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    className="pl-7 text-[15px] font-semibold tabular-nums"
                  />
                </div>
              </Field>

              <Field label="Stock" htmlFor="stock" error={state?.fieldErrors?.stock?.[0]}>
                <Input
                  id="stock"
                  name="stock"
                  value={stock}
                  onChange={(event) => setStock(event.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  className="text-[15px] font-semibold tabular-nums"
                />
              </Field>
            </div>
            {price ? (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-[11.5px] text-muted-foreground">
                Se verá como{" "}
                <span className="font-semibold text-ink">
                  {formatCurrency(Number(price.replace(/\D/g, "")) || 0, settings.currency, settings.locale)}
                </span>{" "}
                en la tienda.
              </p>
            ) : null}
          </Section>

          <Section title="Publicación" description="Elegí quién puede ver el producto.">
            <div className="space-y-2">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const active = status === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                      active ? "border-ink/20 bg-lilac/45" : "border-border bg-white hover:bg-muted/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={active}
                      onChange={() => setStatus(option.value)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full",
                        active ? "bg-white" : "bg-muted",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold">{STATUS_LABELS[option.value]}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                        {STATUS_DESCRIPTIONS[option.value]}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                        active ? "border-ink bg-ink text-white" : "border-ink/20 bg-white",
                      )}
                    >
                      {active ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </Section>

          {product ? (
            <div className="rounded-2xl border border-border/70 bg-white px-4 py-3 text-[11.5px] text-muted-foreground">
              <p>
                Creado el{" "}
                {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(
                  new Date(product.createdAt),
                )}
              </p>
              <p className="mt-0.5">Última edición: {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(product.updatedAt))}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-2 lg:hidden">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/admin/productos">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isPending || categories.length === 0} className="flex-1">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border/70 bg-white p-5 sm:p-6">
      <h2 className="text-[16px] font-bold tracking-tight">{title}</h2>
      {description ? <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-[11.5px] font-medium text-destructive">{error}</p> : null}
      {!error && hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function CoverTag() {
  return (
    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-ink/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
      Portada
    </span>
  );
}
