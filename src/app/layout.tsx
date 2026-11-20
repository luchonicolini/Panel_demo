import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { brandConfig } from "@/config/brand";
import { Providers } from "./providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${brandConfig.name} — Catálogo`,
    template: `%s · ${brandConfig.name}`,
  },
  description: brandConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17141f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-AR"
      className={manrope.variable}
      data-theme="light"
      data-astryx-theme="neutral"
    >
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  "!rounded-2xl !border !border-border/80 !bg-white !text-ink !shadow-soft !font-sans",
                title: "!text-sm !font-semibold",
                description: "!text-[13px] !text-muted-foreground",
                actionButton: "!bg-ink !text-white !rounded-lg",
                cancelButton: "!bg-muted !text-ink !rounded-lg",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
