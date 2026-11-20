import { cn } from "@/lib/utils";
import type { StoreSettings } from "@/lib/types";

type BrandLockupProps = {
  settings: Pick<StoreSettings, "storeName" | "logoUrl">;
  tone?: "light" | "dark";
  orientation?: "vertical" | "horizontal";
  compact?: boolean;
  className?: string;
};

/**
 * Marca reutilizable. Si hay logo cargado desde Configuración lo usa;
 * si no, cae al monograma "Ni." definido en la configuración de marca.
 */
export function BrandLockup({
  settings,
  tone = "light",
  orientation = "vertical",
  compact = false,
  className,
}: BrandLockupProps) {
  if (settings.logoUrl) {
    return (
      <div className={cn("flex items-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={settings.logoUrl}
          alt={settings.storeName}
          className={cn(
            "w-auto object-contain",
            compact ? "h-8 max-w-[132px]" : "h-11 max-w-[180px]",
          )}
        />
      </div>
    );
  }

  const mark = (
    <span
      className={cn(
        "font-extrabold leading-none tracking-[-0.07em]",
        compact ? "text-[28px]" : "text-[44px]",
        tone === "dark" ? "text-white" : "text-ink",
      )}
    >
      Ni<span className="text-[var(--brand)]">.</span>
    </span>
  );

  if (compact || orientation === "horizontal") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        {mark}
        <span
          className={cn(
            "max-w-[150px] text-[13px] font-semibold leading-tight",
            tone === "dark" ? "text-white/85" : "text-ink/75",
          )}
        >
          {settings.storeName}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {mark}
      <span
        className={cn(
          "max-w-[170px] text-[19px] font-semibold leading-[1.15]",
          tone === "dark" ? "text-white/90" : "text-ink/85",
        )}
      >
        {settings.storeName}
      </span>
    </div>
  );
}
