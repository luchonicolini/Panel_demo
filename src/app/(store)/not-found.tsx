import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function StoreNotFound() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-lilac">
        <SearchX className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-[26px] font-extrabold tracking-[-0.03em]">
        Este producto no está disponible
      </h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Puede que se haya archivado o que el enlace ya no exista. Mirá el catálogo completo o
        escribinos por WhatsApp.
      </p>
      <Link
        href="/"
        className="brand-button mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>
    </main>
  );
}
