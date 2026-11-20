"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { CommandMenuTrigger } from "@/components/admin/command-menu";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { isDemoMode } from "@/lib/env";
import type { StoreSettings } from "@/lib/types";

export function AdminMobileHeader({
  settings,
  email,
}: {
  settings: Pick<StoreSettings, "storeName" | "logoUrl">;
  email: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/5 bg-ink px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.08] text-white"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <BrandLockup settings={settings} tone="dark" compact />
      </div>

      <div className="flex items-center gap-2">
        <CommandMenuTrigger variant="mobile" />
        <Link
          href="/admin/productos/nuevo"
          className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand)] text-ink"
          aria-label="Nuevo producto"
        >
          <Plus className="h-5 w-5" strokeWidth={2.4} />
        </Link>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="border-0 bg-ink p-6">
          <SheetTitle className="sr-only">Navegación del panel</SheetTitle>
          <AdminNav
            settings={settings}
            email={email}
            demo={isDemoMode()}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  );
}
