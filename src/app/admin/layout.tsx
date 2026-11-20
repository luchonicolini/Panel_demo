import type { CSSProperties } from "react";
import { AdminMobileHeader } from "@/components/admin/admin-mobile-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { CommandMenuProvider } from "@/components/admin/command-menu";
import { DemoBanner } from "@/components/demo-banner";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const settings = await getRepo().getSettings();

  return (
    <div
      style={{ "--brand": settings.brandColor } as CSSProperties}
      className="min-h-screen bg-canvas"
    >
      <CommandMenuProvider>
        <AdminSidebar settings={settings} email={user.email} />
        <div className="lg:pl-[264px]">
          <AdminMobileHeader settings={settings} email={user.email} />
          <DemoBanner surface="panel" />
          <main className="mx-auto w-full max-w-[1560px] px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
            {children}
          </main>
        </div>
      </CommandMenuProvider>
    </div>
  );
}
