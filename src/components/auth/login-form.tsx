"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Eye, EyeOff, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type LoginState } from "@/lib/actions/auth";

export function LoginForm({
  next,
  demo,
  demoEmail,
  demoPassword,
}: {
  next: string;
  demo: boolean;
  demoEmail?: string;
  demoPassword?: string;
}) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(signInAction, null);
  const [email, setEmail] = useState(demo ? demoEmail ?? "" : "");
  const [password, setPassword] = useState(demo ? demoPassword ?? "" : "");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-[380px]">
      <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.04em]">
        Ingresar al panel
      </h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        Administrá productos, precios y stock de tu tienda.
      </p>

      <form action={formAction} className="mt-7 space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink/40 transition-colors hover:bg-muted hover:text-ink"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {state?.error ? (
          <div role="alert" className="flex items-start gap-2 rounded-xl bg-peach px-3.5 py-3 text-[12.5px] font-medium leading-snug">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {state.error}
          </div>
        ) : null}

        <Button type="submit" className="h-11 w-full" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Ingresando…" : "Ingresar"}
          {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      {demo && demoEmail && demoPassword ? (
        <div className="mt-5 rounded-2xl border border-border/70 bg-white/70 px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Modo demo local
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
            Sin Supabase configurado. Usá{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10.5px] text-ink">{demoEmail}</code>{" "}
            y la contraseña{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10.5px] text-ink">{demoPassword}</code>.
          </p>
          <button
            type="button"
            onClick={() => {
              setEmail(demoEmail);
              setPassword(demoPassword);
            }}
            className="mt-2 text-[11px] font-semibold underline underline-offset-4 hover:text-ink/70"
          >
            Completar credenciales
          </button>
        </div>
      ) : null}

      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-ink"
      >
        <Store className="h-3.5 w-3.5" />
        Ver la tienda
      </Link>
    </div>
  );
}
