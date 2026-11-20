"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Plus,
  Tags,
  Trash2,
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  renameCategoryAction,
} from "@/lib/actions/categories";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingPending, setDeletingPending] = useState(false);

  const otherCategories = useMemo(
    () => categories.filter((category) => category.id !== deleting?.id),
    [categories, deleting?.id],
  );

  useEffect(() => {
    if (deleting) setReassignTo(otherCategories[0]?.id ?? "");
  }, [deleting, otherCategories]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const result = await createCategoryAction(name.trim());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Categoría creada.");
      setName("");
      router.refresh();
    } catch {
      toast.error("No pudimos crear la categoría.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRename() {
    if (!editing || !editName.trim()) return;
    setSavingEdit(true);
    try {
      const result = await renameCategoryAction(editing.id, editName.trim());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Categoría renombrada.");
      setEditing(null);
      router.refresh();
    } catch {
      toast.error("No pudimos renombrar la categoría.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleMove(category: Category, direction: "up" | "down") {
    setBusyId(category.id);
    try {
      const result = await moveCategoryAction(category.id, direction);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    } catch {
      toast.error("No pudimos ordenar las categorías.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingPending(true);
    try {
      const result = await deleteCategoryAction(
        deleting.id,
        deleting.productCount > 0 ? reassignTo : undefined,
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        deleting.productCount > 0
          ? "Productos reasignados y categoría eliminada."
          : "Categoría eliminada.",
      );
      setDeleting(null);
      router.refresh();
    } catch {
      toast.error("No pudimos eliminar la categoría.");
    } finally {
      setDeletingPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Organización
        </p>
        <h1 className="mt-1.5 text-[32px] font-extrabold leading-none tracking-[-0.045em] sm:text-[38px]">
          Categorías
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          El orden define cómo se agrupan los productos en la tienda. Si eliminás una categoría con
          productos, primero elegís dónde reasignarlos.
        </p>
      </header>

      <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre de la nueva categoría"
          maxLength={60}
          aria-label="Nombre de la nueva categoría"
          className="h-11 flex-1"
        />
        <Button type="submit" disabled={creating || !name.trim()} className="h-11">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear categoría
        </Button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-white">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-lilac">
              <Tags className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold">Todavía no hay categorías</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Creá la primera para poder asignar productos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5",
                  busyId === category.id && "pointer-events-none opacity-60",
                )}
              >
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0}
                    onClick={() => handleMove(category, "up")}
                    aria-label={`Mover ${category.name} hacia arriba`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === categories.length - 1}
                    onClick={() => handleMove(category, "down")}
                    aria-label={`Mover ${category.name} hacia abajo`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{category.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    /{category.slug} ·{" "}
                    {category.productCount === 0
                      ? "Sin productos"
                      : `${category.productCount} producto${category.productCount === 1 ? "" : "s"}`}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditing(category);
                      setEditName(category.name);
                    }}
                    aria-label={`Renombrar ${category.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleting(category)}
                    aria-label={`Eliminar ${category.name}`}
                    className="text-ink/45 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Renombrar categoría</DialogTitle>
            <DialogDescription>
              El cambio se refleja en el catálogo público y en los filtros del panel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rename-category">Nombre</Label>
            <Input
              id="rename-category"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              maxLength={60}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button onClick={handleRename} disabled={savingEdit || !editName.trim()}>
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar nombre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              {deleting?.productCount
                ? `"${deleting?.name}" tiene ${deleting.productCount} producto(s) asignado(s). Elegí dónde reasignarlos antes de eliminarla.`
                : `"${deleting?.name}" no tiene productos asignados. Esta acción no se puede deshacer.`}
            </DialogDescription>
          </DialogHeader>

          {deleting && deleting.productCount > 0 ? (
            otherCategories.length > 0 ? (
              <div className="space-y-1.5">
                <Label>Reasignar productos a</Label>
                <Select value={reassignTo} onValueChange={setReassignTo}>
                  <SelectTrigger aria-label="Categoría de destino">
                    <SelectValue placeholder="Elegí una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="flex items-start gap-1.5 pt-1 text-[11px] leading-snug text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Los productos mantienen su estado y datos; solo cambia su categoría.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl bg-peach px-3.5 py-3 text-[12px] leading-relaxed">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  No hay otra categoría disponible. Creá una nueva para poder reasignar los
                  productos.
                </p>
              </div>
            )
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deletingPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                deletingPending ||
                Boolean(deleting && deleting.productCount > 0 && !reassignTo)
              }
            >
              {deletingPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting && deleting.productCount > 0 ? "Reasignar y eliminar" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
