import { AdminNav } from "@/components/admin/admin-nav";
import { isDemoMode } from "@/lib/env";
import type { StoreSettings } from "@/lib/types";

export function AdminSidebar({
  settings,
  email,
}: {
  settings: Pick<StoreSettings, "storeName" | "logoUrl">;
  email: string;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col bg-ink px-6 py-7 lg:flex">
      <AdminNav settings={settings} email={email} demo={isDemoMode()} />
    </aside>
  );
}
