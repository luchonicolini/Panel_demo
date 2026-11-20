import { afterEach, describe, expect, it, vi } from "vitest";
import { getRuntimeConfigError, isDemoMode } from "@/lib/env";

function stub(overrides: Record<string, string>) {
  vi.stubEnv("NEXT_PHASE", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  vi.stubEnv("DEMO_MODE", "");
  vi.stubEnv("DEMO_AUTH_SECRET", "");
  vi.stubEnv("DEMO_ADMIN_PASSWORD", "");

  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("modo demo y configuración de runtime", () => {
  it("en desarrollo activa la demo si falta Supabase", () => {
    stub({ NODE_ENV: "development" });

    expect(isDemoMode()).toBe(true);
    expect(getRuntimeConfigError()).toBeNull();
  });

  it("en producción sin Supabase no activa la demo y falla la configuración", () => {
    stub({ NODE_ENV: "production" });

    expect(isDemoMode()).toBe(false);
    expect(getRuntimeConfigError()).toContain("Falta configurar NEXT_PUBLIC_SUPABASE_URL");
  });

  it("en producción con Supabase configurado usa el backend real", () => {
    stub({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://demo.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "a".repeat(40),
    });

    expect(isDemoMode()).toBe(false);
    expect(getRuntimeConfigError()).toBeNull();
  });

  it("rechaza una demo de producción con secreto por defecto", () => {
    stub({ NODE_ENV: "production", DEMO_MODE: "true" });

    expect(isDemoMode()).toBe(true);
    expect(getRuntimeConfigError()).toContain("DEMO_AUTH_SECRET");
  });

  it("rechaza una demo de producción con el secreto de ejemplo", () => {
    stub({
      NODE_ENV: "production",
      DEMO_MODE: "true",
      DEMO_AUTH_SECRET: "cambia-este-secreto-en-desarrollo",
      DEMO_ADMIN_PASSWORD: "clave-propia-123",
    });

    expect(getRuntimeConfigError()).toContain("DEMO_AUTH_SECRET");
  });

  it("rechaza una demo de producción con la contraseña demo", () => {
    stub({
      NODE_ENV: "production",
      DEMO_MODE: "true",
      DEMO_AUTH_SECRET: "un-secreto-largo-de-cuarenta-caracteres-123",
      DEMO_ADMIN_PASSWORD: "demo1234",
    });

    expect(getRuntimeConfigError()).toContain("DEMO_ADMIN_PASSWORD");
  });

  it("acepta una demo de producción con credenciales propias", () => {
    stub({
      NODE_ENV: "production",
      DEMO_MODE: "true",
      DEMO_AUTH_SECRET: "un-secreto-largo-de-cuarenta-caracteres-123",
      DEMO_ADMIN_PASSWORD: "clave-propia-123",
    });

    expect(isDemoMode()).toBe(true);
    expect(getRuntimeConfigError()).toBeNull();
  });
});
