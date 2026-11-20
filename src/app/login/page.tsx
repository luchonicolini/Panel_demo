import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { defaultSettings } from "@/config/brand";
import { getAdminUser } from "@/lib/auth";
import { getDemoCredentials } from "@/lib/demo-session";
import { isDemoMode } from "@/lib/env";
import { getRepo } from "@/lib/repo";
import type { StoreSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ingresar",
};

type SearchParams = Promise<{ next?: string | string[] }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getAdminUser();
  if (user) redirect("/admin/productos");

  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/admin/productos";

  let settings: StoreSettings = { ...defaultSettings };
  try {
    settings = await getRepo().getSettings();
  } catch {
    // Si la base todavía no está migrada, mostramos la marca por defecto.
  }

  const demo = isDemoMode();
  const credentials = demo ? getDemoCredentials() : null;

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: settings.brandColor }}
        />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-80 w-80 rounded-full bg-lilac/10 blur-3xl" />

        <div className="relative">
          <BrandLockup settings={settings} tone="dark" />
        </div>

        <div className="relative max-w-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: settings.brandColor }}>
            Panel de administración
          </p>
          <h2 className="mt-4 text-[44px] font-extrabold leading-[1.02] tracking-[-0.05em] text-white">
            Tu catálogo,
            <br />
            en orden.
          </h2>
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-white/50">
            Cargá productos, controlá stock y publicá cambios en la tienda desde un solo lugar.
            La venta sigue por WhatsApp.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-[11px] text-white/35">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: settings.brandColor }} />
          Starter e-commerce · Next.js + Supabase
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between lg:hidden">
          <BrandLockup settings={settings} compact />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Panel
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <LoginForm
            next={next}
            demo={demo}
            demoEmail={credentials?.email}
            demoPassword={credentials?.password}
          />
        </div>

        <p className="text-center text-[10.5px] text-muted-foreground lg:text-right">
          {settings.storeName} · Acceso privado
        </p>
      </main>
    </div>
  );
}
