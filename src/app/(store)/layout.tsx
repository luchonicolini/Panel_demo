import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { DemoBanner } from "@/components/demo-banner";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";
import { getRepo } from "@/lib/repo";
import { defaultSettings } from "@/config/brand";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getRepo().getSettings();
    return {
      title: {
        absolute: `${settings.storeName} — Catálogo`,
        template: `%s · ${settings.storeName}`,
      },
    };
  } catch {
    return {
      title: {
        absolute: `${defaultSettings.storeName} — Catálogo`,
        template: `%s · ${defaultSettings.storeName}`,
      },
    };
  }
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const repo = getRepo();
  const [settings, categories] = await Promise.all([repo.getSettings(), repo.listCategories()]);

  return (
    <div
      style={{ "--brand": settings.brandColor } as CSSProperties}
      className="flex min-h-screen flex-col bg-canvas"
    >
      <DemoBanner surface="tienda" />
      <StoreHeader settings={settings} categories={categories} />
      <div className="flex-1">{children}</div>
      <StoreFooter settings={settings} />
    </div>
  );
}
