"use client";

import { useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CommandPalette,
  CommandPaletteInput,
} from "@astryxdesign/core/CommandPalette";
import type { SearchSource, SearchableItem } from "@astryxdesign/core/Typeahead";
import {
  Folder,
  Package,
  Plus,
  Search,
  Settings,
  Store,
  Tags,
} from "lucide-react";
import {
  searchAdminCatalog,
  type CommandCatalogResult,
} from "@/lib/actions/command";
import { cn } from "@/lib/utils";

type CommandIconName = "plus" | "package" | "tags" | "settings" | "store" | "search";

type CommandAux = {
  group: "Acciones" | "Productos" | "Categorías";
  kind: "action" | "product" | "category";
  description: string;
  href: string;
  icon: CommandIconName;
  badge?: string;
};

type CommandItem = SearchableItem<CommandAux>;

type CommandAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: CommandIconName;
  keywords: string;
};

const ACTIONS: CommandAction[] = [
  {
    id: "action:new-product",
    label: "Nuevo producto",
    description: "Crear una ficha desde cero",
    href: "/admin/productos/nuevo",
    icon: "plus",
    keywords: "crear agregar alta producto",
  },
  {
    id: "action:products",
    label: "Productos",
    description: "Ver y filtrar el catálogo completo",
    href: "/admin/productos",
    icon: "package",
    keywords: "catálogo listado inventario",
  },
  {
    id: "action:categories",
    label: "Categorías",
    description: "Ordenar y renombrar las categorías",
    href: "/admin/categorias",
    icon: "tags",
    keywords: "categoría ordenar renombrar",
  },
  {
    id: "action:settings",
    label: "Configuración",
    description: "Marca, WhatsApp y stock bajo",
    href: "/admin/configuracion",
    icon: "settings",
    keywords: "ajustes marca whatsapp stock",
  },
  {
    id: "action:store",
    label: "Ver tienda",
    description: "Abrir el catálogo público",
    href: "/",
    icon: "store",
    keywords: "catálogo público tienda web",
  },
];

const STATUS_LABEL = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
} as const;

const STATUS_STYLE = {
  draft: "bg-lilac text-ink",
  published: "bg-brand-soft text-ink",
  archived: "bg-muted text-muted-foreground",
} as const;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function ItemIcon({ name }: { name: CommandIconName }) {
  const icons = {
    plus: Plus,
    package: Package,
    tags: Tags,
    settings: Settings,
    store: Store,
    search: Search,
  };
  const Icon = icons[name] ?? Folder;

  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lilac text-ink">
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
  );
}

function buildItems(
  data: CommandCatalogResult,
  query: string,
  itemMap: Map<string, CommandItem>,
) {
  const normalizedQuery = normalize(query);

  const actions = ACTIONS.filter((action) => {
    if (!normalizedQuery) return true;
    return normalize(`${action.label} ${action.description} ${action.keywords}`).includes(
      normalizedQuery,
    );
  }).map<CommandItem>((action) => ({
    id: action.id,
    label: action.label,
    auxiliaryData: {
      group: "Acciones",
      kind: "action",
      description: action.description,
      href: action.href,
      icon: action.icon,
    },
  }));

  const products = data.products.map<CommandItem>((product) => ({
    id: `product:${product.id}`,
    label: product.name,
    auxiliaryData: {
      group: "Productos",
      kind: "product",
      description: product.sku,
      href: `/admin/productos/${product.id}`,
      icon: "package",
      badge: STATUS_LABEL[product.status],
    },
  }));

  const categories = data.categories.map<CommandItem>((category) => ({
    id: `category:${category.id}`,
    label: category.name,
    auxiliaryData: {
      group: "Categorías",
      kind: "category",
      description: "Filtrar productos por categoría",
      href: `/admin/productos?categoria=${encodeURIComponent(category.id)}`,
      icon: "tags",
    },
  }));

  const items = [...actions, ...products, ...categories];
  itemMap.clear();
  items.forEach((item) => itemMap.set(item.id, item));
  return items;
}

export function AdminCommandPalette({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const router = useRouter();
  const itemMap = useRef(new Map<string, CommandItem>());

  const searchSource = useMemo<SearchSource<CommandItem>>(() => {
    let requestId = 0;

    return {
      async bootstrap() {
        const current = ++requestId;
        try {
          const data = await searchAdminCatalog("");
          if (current !== requestId) return [];
          return buildItems(data, "", itemMap.current);
        } catch {
          return buildItems({ products: [], categories: [] }, "", itemMap.current);
        }
      },
      async search(query) {
        const current = ++requestId;
        await new Promise((resolve) => setTimeout(resolve, 120));
        if (current !== requestId) return [];

        try {
          const data = await searchAdminCatalog(query);
          if (current !== requestId) return [];
          return buildItems(data, query, itemMap.current);
        } catch {
          return buildItems({ products: [], categories: [] }, query, itemMap.current);
        }
      },
      cancel() {
        requestId += 1;
      },
    };
  }, []);

  const handleValueChange = useCallback(
    (value: string) => {
      const item = itemMap.current.get(value);
      const href = item?.auxiliaryData?.href;
      onOpenChange(false);
      if (href) router.push(href);
    },
    [onOpenChange, router],
  );

  return (
    <CommandPalette
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      searchSource={searchSource}
      onValueChange={handleValueChange}
      label="Buscar en el panel"
      width="min(680px, calc(100vw - 24px))"
      maxHeight="min(560px, calc(100dvh - 96px))"
      className="nicolini-command-palette"
      input={
        <CommandPaletteInput
          label="Buscar en el panel"
          placeholder="Buscar productos, secciones o acciones…"
        />
      }
      emptySearchText="No encontramos resultados."
      emptyBootstrapText="Escribí para buscar en el panel."
      renderItem={(item) => {
        const aux = item.auxiliaryData;
        if (!aux) return item.label;

        return (
          <div className="flex w-full min-w-0 items-center gap-3">
            <ItemIcon name={aux.icon} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-ink">
                {item.label}
              </p>
              <p className="truncate text-[11.5px] text-muted-foreground">
                {aux.description}
              </p>
            </div>
            {aux.badge ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  STATUS_STYLE[
                    aux.badge === "Publicado"
                      ? "published"
                      : aux.badge === "Borrador"
                        ? "draft"
                        : "archived"
                  ],
                )}
              >
                {aux.badge}
              </span>
            ) : null}
          </div>
        );
      }}
    />
  );
}
