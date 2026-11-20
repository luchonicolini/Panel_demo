"use client";

import Link from "next/link";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { LinkProvider } from "@astryxdesign/core/Link";
import { Theme } from "@astryxdesign/core/theme";
import esES from "@astryxdesign/core/locales/es-ES.generated.js";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";

/**
 * Astryx se usa como capa de detalles (command palette, tooltips, skeletons).
 * El tema neutral se mantiene en modo claro para acompañar la identidad Nicolini.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <InternationalizationProvider locale="es-ES" messages={{ "es-ES": esES }}>
      <Theme theme={neutralTheme} mode="light">
        <LinkProvider component={Link}>{children}</LinkProvider>
      </Theme>
    </InternationalizationProvider>
  );
}
