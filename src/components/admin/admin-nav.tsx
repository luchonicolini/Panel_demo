"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Package, Settings, Tags } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { CommandMenuTrigger } from "@/components/admin/command-menu";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { StoreSettings } from "@/lib/types";

const navItems = [
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminNav({
  settings,
  email,
  demo,
  onNavigate,
}: {
  settings: Pick<StoreSettings, "storeName" | "logoUrl">;
  email: string;
  demo: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <Link href="/admin/productos" onClick={onNavigate} className="mb-9 block w-fit">
        <BrandLockup settings={settings} tone="dark" />
      </Link>

      <CommandMenuTrigger />

      <nav className="flex flex-col gap-1.5" aria-label="Panel">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors",
                active
                  ? "bg-[var(--brand)] text-ink"
                  : "text-white/65 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-2xl bg-white/[0.08] px-4 py-3 text-[14px] font-semibold text-white/80 transition-colors hover:bg-white/[0.13] hover:text-white"
        >
          Ver tienda
          <ExternalLink className="h-4 w-4" />
        </Link>

        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-white/40">Sesión</p>
            <p className="truncate text-[12px] text-white/65">{email}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="grid h-9 w-9 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>

        {demo ? (
          <p
            className="px-1 pb-1 text-[10px] leading-relaxed text-white/30"
            title="Configurá Supabase para usar autenticación y base de datos en producción"
          >
            Modo demo local
          </p>
        ) : null}
      </div>
    </div>
  );
}
