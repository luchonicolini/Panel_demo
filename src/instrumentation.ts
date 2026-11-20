/**
 * Se ejecuta una vez al arrancar el servidor. Falla rápido si en producción
 * falta Supabase o si el modo demo quedó habilitado con credenciales inseguras.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertRuntimeEnv } = await import("@/lib/env");
  assertRuntimeEnv();
}
