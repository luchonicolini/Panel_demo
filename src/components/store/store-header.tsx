import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { whatsappLink } from "@/lib/format";
import type { Category, StoreSettings } from "@/lib/types";

export function StoreHeader({
  settings,
  categories,
}: {
  settings: StoreSettings;
  categories: Category[];
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/[0.06] bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={`${settings.storeName} — inicio`}>
          <BrandLockup settings={settings} compact />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Catálogo">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-[13px] font-semibold text-ink/65 transition-colors hover:bg-white hover:text-ink"
          >
            Todo
          </Link>
          {categories.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              href={`/?categoria=${encodeURIComponent(category.slug)}`}
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-ink/55 transition-colors hover:bg-white hover:text-ink"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <a
          href={whatsappLink(
            settings.whatsapp,
            `Hola ${settings.storeName}! Quiero hacer una consulta sobre el catálogo.`,
          )}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-ink/90 sm:px-4"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </div>
    </header>
  );
}
