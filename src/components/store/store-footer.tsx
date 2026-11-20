import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { brandConfig } from "@/config/brand";
import { whatsappLink } from "@/lib/format";
import type { StoreSettings } from "@/lib/types";

export function StoreFooter({ settings }: { settings: StoreSettings }) {
  return (
    <footer className="mt-20 border-t border-ink/[0.07] bg-white/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandLockup settings={settings} />
          <p className="mt-4 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
            {brandConfig.description}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Contacto
          </p>
          <div className="mt-3 space-y-2 text-[12.5px]">
            <a
              href={whatsappLink(settings.whatsapp, `Hola ${settings.storeName}! Quiero consultar.`)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 font-semibold text-ink transition-colors hover:text-ink/60"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Escribinos por WhatsApp
            </a>
            <p className="text-muted-foreground">{brandConfig.email}</p>
            <p className="text-muted-foreground">{brandConfig.instagram}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Tienda
          </p>
          <div className="mt-3 space-y-2 text-[12.5px]">
            <Link href="/" className="block text-muted-foreground transition-colors hover:text-ink">
              Catálogo completo
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-ink"
            >
              Acceso administrador
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-ink/[0.05]">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-[10.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. Todos los derechos reservados.
          </p>
          <p>{brandConfig.footerNote}</p>
        </div>
      </div>
    </footer>
  );
}
