"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  ImagePlus,
  Info,
  Loader2,
  Palette,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettingsAction, type SettingsFormState } from "@/lib/actions/settings";
import { IMAGE_ACCEPT_ATTRIBUTE, validateImageFile } from "@/lib/image-rules";
import { cn } from "@/lib/utils";
import type { StoreSettings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<SettingsFormState, FormData>(
    updateSettingsAction,
    null,
  );

  const [storeName, setStoreName] = useState(settings.storeName);
  const [brandColor, setBrandColor] = useState(settings.brandColor);
  const [logoUrl, setLogoUrl] = useState<string | null>(settings.logoUrl);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    previewRef.current = logoPreview;
  }, [logoPreview]);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (state.success && state.settings) {
      toast.success("Configuración guardada.");
      setLogoUrl(state.settings.logoUrl);
      setLogoPreview(null);
      setLogoFile(null);
      setRemoveLogo(false);
      setStoreName(state.settings.storeName);
      setBrandColor(state.settings.brandColor);
      if (logoInputRef.current) logoInputRef.current.value = "";
      router.refresh();
    }
  }, [state, router]);

  function handleLogo(file: File | undefined) {
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setRemoveLogo(false);
  }

  function clearLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    setLogoFile(null);
    setRemoveLogo(true);
    setLogoUrl(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  const previewLogo = logoPreview ?? (removeLogo ? null : logoUrl);
  const previewColor = /^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : settings.brandColor;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="removeLogo" value={removeLogo ? "1" : "0"} />
      <input type="hidden" name="currency" value="ARS" />
      <input type="hidden" name="locale" value="es-AR" />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Marca y tienda
          </p>
          <h1 className="mt-1.5 text-[32px] font-extrabold leading-none tracking-[-0.045em] sm:text-[38px]">
            Configuración
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
            Estos valores se usan en el panel y en la tienda pública. El catálogo arranca en pesos
            argentinos y español de Argentina.
          </p>
        </div>
        <Button type="submit" disabled={isPending} className="h-11">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </header>

      {state?.error ? (
        <div role="alert" className="flex items-start gap-2 rounded-2xl bg-peach px-4 py-3 text-[13px] font-medium">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-border/70 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-ink/50" />
              <h2 className="text-[16px] font-bold">Identidad</h2>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="storeName">Nombre de la tienda</Label>
                <Input
                  id="storeName"
                  name="storeName"
                  value={storeName}
                  onChange={(event) => setStoreName(event.target.value)}
                  maxLength={80}
                  required
                />
                {state?.fieldErrors?.storeName?.[0] ? (
                  <p className="text-[11.5px] font-medium text-destructive">
                    {state.fieldErrors.storeName[0]}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label>Logo</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-border bg-ink">
                    {previewLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewLogo} alt="Logo de la tienda" className="h-full w-full object-contain p-1.5" />
                    ) : (
                      <span className="text-[22px] font-extrabold text-white">
                        Ni<span style={{ color: previewColor }}>.</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-[12px] font-semibold transition-colors hover:bg-muted">
                      <ImagePlus className="h-3.5 w-3.5" />
                      {previewLogo ? "Cambiar logo" : "Subir logo"}
                      <input
                        ref={logoInputRef}
                        type="file"
                        name="logo"
                        accept={IMAGE_ACCEPT_ATTRIBUTE}
                        className="sr-only"
                        onChange={(event) => handleLogo(event.target.files?.[0])}
                      />
                    </label>
                    {previewLogo ? (
                      <Button type="button" variant="ghost" size="sm" onClick={clearLogo}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Quitar
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  PNG, JPG, WebP o AVIF. Ideal horizontal, fondo transparente.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brandColor">Color de marca</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : "#c9f26b"}
                    onChange={(event) => setBrandColor(event.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-white p-1"
                    aria-label="Selector de color de marca"
                  />
                  <Input
                    id="brandColor"
                    name="brandColor"
                    value={brandColor}
                    onChange={(event) => setBrandColor(event.target.value)}
                    maxLength={7}
                    className="w-[120px] font-mono uppercase"
                    aria-label="Código de color de marca"
                  />
                  <span
                    className="h-8 flex-1 rounded-lg border border-border/50"
                    style={{ background: previewColor }}
                    aria-hidden
                  />
                </div>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Palette className="h-3 w-3" />
                  Se usa en botones principales y acentos del panel.
                </p>
                {state?.fieldErrors?.brandColor?.[0] ? (
                  <p className="text-[11.5px] font-medium text-destructive">
                    {state.fieldErrors.brandColor[0]}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border/70 bg-white p-5 sm:p-6">
            <h2 className="text-[16px] font-bold">Venta y stock</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  defaultValue={settings.whatsapp}
                  placeholder="5491123456789"
                  inputMode="tel"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Con código de país y sin +, espacios ni guiones. Se usa en el botón de consulta de
                  cada producto.
                </p>
                {state?.fieldErrors?.whatsapp?.[0] ? (
                  <p className="text-[11.5px] font-medium text-destructive">
                    {state.fieldErrors.whatsapp[0]}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lowStockThreshold">Umbral de stock bajo</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="lowStockThreshold"
                    name="lowStockThreshold"
                    type="number"
                    min={1}
                    max={10000}
                    defaultValue={settings.lowStockThreshold}
                    className="w-[120px] font-semibold tabular-nums"
                    required
                  />
                  <p className="text-[11.5px] leading-snug text-muted-foreground">
                    Los productos publicados con stock menor a este número aparecen en{" "}
                    <span className="font-semibold text-ink">Stock bajo</span>.
                  </p>
                </div>
                {state?.fieldErrors?.lowStockThreshold?.[0] ? (
                  <p className="text-[11.5px] font-medium text-destructive">
                    {state.fieldErrors.lowStockThreshold[0]}
                  </p>
                ) : null}
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-muted/60 px-3.5 py-3 text-[11.5px] leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Moneda: <strong className="text-ink">ARS</strong> · Idioma:{" "}
                  <strong className="text-ink">Español (Argentina)</strong>. Estos valores iniciales
                  se configuran en <code className="rounded bg-white px-1 py-0.5">src/config/brand.ts</code>.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl bg-ink p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              Vista previa
            </p>
            <div className="mt-4 rounded-2xl bg-white/[0.06] p-4">
              <div className="flex h-20 items-center justify-center">
                {previewLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewLogo} alt="Vista previa del logo" className="max-h-16 max-w-full object-contain" />
                ) : (
                  <span className="text-[42px] font-extrabold leading-none tracking-[-0.07em]">
                    Ni<span style={{ color: previewColor }}>.</span>
                  </span>
                )}
              </div>
              <p className="mt-2 truncate text-center text-[14px] font-semibold text-white/85">
                {storeName || "Nombre de la tienda"}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[11px] text-white/45">Color de acción</span>
              <span
                className="h-5 w-9 rounded-md border border-white/20"
                style={{ background: previewColor }}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-border/70 bg-white p-5">
            <h2 className="text-[14px] font-bold">Reutilizar el starter</h2>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
              Para un cliente nuevo, cambiá la marca en{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[10.5px]">src/config/brand.ts</code>,
              conectá otro proyecto de Supabase y corré las migraciones. Los datos de esta tienda
              quedan aislados en su propio proyecto.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  "bg-[var(--brand)]",
                )}
              />
              <span className="text-[10.5px] text-muted-foreground">
                Marca aplicada en todo el panel
              </span>
            </div>
          </section>
        </aside>
      </div>

      <div className="flex justify-end lg:hidden">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
