"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { applyImportAction, previewImportAction } from "@/lib/actions/import";
import { cn } from "@/lib/utils";
import type { ImportPreview } from "@/lib/types";

const STATUS_LABEL: Record<"create" | "update" | "error", string> = {
  create: "Se crea",
  update: "Se actualiza",
  error: "Con errores",
};

export function ImportDialog({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFileName(null);
    setCsvText("");
    setPreview(null);
    setError(null);
    setLoading(false);
    setApplying(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPreview(null);

    if (file.size > 2 * 1024 * 1024) {
      setError("El archivo supera los 2 MB.");
      return;
    }

    setFileName(file.name);
    setLoading(true);
    try {
      const text = await file.text();
      setCsvText(text);
      const result = await previewImportAction(text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreview(result.preview);
      if (result.preview.fatalError) setError(result.preview.fatalError);
    } catch {
      setError("No pudimos leer el archivo. Verificá que sea un CSV válido.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!csvText) return;
    setError(null);
    setApplying(true);
    try {
      const result = await applyImportAction(csvText);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(
        `Importación aplicada: ${result.created} producto(s) creado(s) y ${result.updated} actualizado(s).`,
      );
      onImported();
      handleOpenChange(false);
    } catch {
      setError("No pudimos aplicar la importación. No se aplicó ningún cambio.");
      toast.error("No pudimos aplicar la importación.");
    } finally {
      setApplying(false);
    }
  }

  const rowsToShow = preview?.rows.slice(0, 60) ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="h-11 shrink-0">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar productos</DialogTitle>
          <DialogDescription>
            Usá el SKU para identificar productos existentes. Si un SKU se repite dentro del
            archivo, la carga se rechaza completa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <a
            href="/api/import/template"
            download
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink underline-offset-4 hover:underline"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar plantilla CSV
          </a>
          <span className="text-[11px] text-muted-foreground">Máx. 2 MB · 500 filas</span>
        </div>

        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/15 bg-muted/40 px-4 py-7 text-center transition-colors hover:bg-muted/70",
            fileName && "border-solid border-ink/10 bg-white",
          )}
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-lilac">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <span className="text-[13px] font-semibold">
            {fileName ?? "Elegí un archivo CSV"}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {fileName ? "Tocá para reemplazarlo" : "Columnas: nombre, sku, categoría, precio, stock, estado"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/50 py-6 text-[13px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analizando archivo…
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-xl bg-peach px-3.5 py-3 text-[12.5px] font-medium leading-relaxed">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {preview && !loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-brand-faint px-3 py-2.5">
                <p className="text-[19px] font-extrabold leading-none tabular-nums">{preview.createCount}</p>
                <p className="mt-1 text-[10.5px] font-semibold text-ink/60">Se crean</p>
              </div>
              <div className="rounded-xl bg-lilac px-3 py-2.5">
                <p className="text-[19px] font-extrabold leading-none tabular-nums">{preview.updateCount}</p>
                <p className="mt-1 text-[10.5px] font-semibold text-ink/60">Se actualizan</p>
              </div>
              <div className={cn("rounded-xl px-3 py-2.5", preview.errorCount > 0 ? "bg-peach" : "bg-muted")}>
                <p className="text-[19px] font-extrabold leading-none tabular-nums">{preview.errorCount}</p>
                <p className="mt-1 text-[10.5px] font-semibold text-ink/60">Con errores</p>
              </div>
            </div>

            {preview.errorCount > 0 ? (
              <div className="flex items-start gap-2 rounded-xl border border-ink/10 bg-white px-3.5 py-3 text-[12px] leading-relaxed">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ink/60" />
                <p>
                  Corregí las filas marcadas y volvé a cargar el archivo. Si confirmás ahora, el
                  servidor rechazará la importación y <strong>no se aplicará ningún cambio</strong>.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl bg-brand-faint px-3.5 py-3 text-[12px] leading-relaxed">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>El archivo está listo. Revisá el resumen y aplicá los cambios.</p>
              </div>
            )}

            <div className="max-h-[260px] overflow-auto rounded-xl border border-border/70">
              <table className="w-full text-left text-[11.5px]">
                <thead className="sticky top-0 bg-muted/90 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-2.5 py-2">Fila</th>
                    <th className="px-2.5 py-2">SKU</th>
                    <th className="px-2.5 py-2">Producto</th>
                    <th className="px-2.5 py-2 text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rowsToShow.map((row) => (
                    <tr key={`${row.line}-${row.sku}`} className={cn(row.status === "error" && "bg-peach/40")}>
                      <td className="px-2.5 py-2 align-top tabular-nums text-muted-foreground">{row.line}</td>
                      <td className="px-2.5 py-2 align-top font-mono text-[10.5px]">{row.sku || "—"}</td>
                      <td className="px-2.5 py-2 align-top">
                        <span className="block font-semibold">{row.name || "Sin nombre"}</span>
                        {row.errors.length > 0 ? (
                          <ul className="mt-1 space-y-0.5 text-[10.5px] font-medium text-ink/70">
                            {row.errors.map((rowError) => (
                              <li key={rowError}>• {rowError}</li>
                            ))}
                          </ul>
                        ) : null}
                      </td>
                      <td className="px-2.5 py-2 text-right align-top">
                        <span
                          className={cn(
                            "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                            row.status === "create" && "bg-brand-soft",
                            row.status === "update" && "bg-lilac",
                            row.status === "error" && "bg-white",
                          )}
                        >
                          {STATUS_LABEL[row.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.rows.length > rowsToShow.length ? (
              <p className="text-[11px] text-muted-foreground">
                Mostrando {rowsToShow.length} de {preview.rows.length} filas.
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="mt-1">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={applying}>
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            disabled={!preview || loading || applying || preview.fatalError !== undefined}
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {applying ? "Aplicando…" : "Aplicar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
