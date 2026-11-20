import { AlertTriangle } from "lucide-react";
import { isDemoMode } from "@/lib/env";

/**
 * Aviso visible cuando la app corre sin Supabase. En producción solo puede
 * aparecer si DEMO_MODE=true fue configurado explícitamente.
 */
export function DemoBanner({ surface }: { surface: "panel" | "tienda" }) {
  if (!isDemoMode()) return null;

  const production = process.env.NODE_ENV === "production";

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-ink/10 bg-peach px-4 py-2 text-center text-[11.5px] font-medium leading-snug text-ink"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>
        <strong className="font-bold">Modo demo {surface}.</strong>{" "}
        {production
          ? "Los datos son locales y no se sincronizan con Supabase. No usar como entorno real."
          : "Los datos se guardan en el servidor local y no se sincronizan con Supabase."}
      </span>
    </div>
  );
}
