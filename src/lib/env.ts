export const DEFAULT_DEMO_SECRET = "nicolini-demo-local-secret";
export const EXAMPLE_DEMO_SECRET = "cambia-este-secreto-en-desarrollo";
export const DEFAULT_DEMO_PASSWORD = "demo1234";
export const MIN_DEMO_SECRET_LENGTH = 32;

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  return (
    /^https?:\/\//.test(url) &&
    !url.includes("TU-PROYECTO") &&
    key.length > 30 &&
    !key.includes("TU_ANON_KEY")
  );
}

function demoFlag(): boolean | null {
  const value = process.env.DEMO_MODE?.trim().toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function isBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * El modo demo permite levantar la app sin credenciales de Supabase.
 * En desarrollo se activa solo si falta configuración. En producción exige
 * DEMO_MODE=true de forma explícita para evitar despliegues accidentales.
 */
export function isDemoMode() {
  const flag = demoFlag();
  if (flag !== null) return flag;
  if (isBuildPhase()) return !isSupabaseConfigured();
  if (isProduction()) return false;
  return !isSupabaseConfigured();
}

/**
 * Devuelve un mensaje si la configuración de runtime es insegura o incompleta.
 * En producción no se permite arrancar en demo implícito ni con credenciales
 * de demostración conocidas.
 */
export function getRuntimeConfigError(): string | null {
  if (!isProduction() || isBuildPhase()) return null;

  if (demoFlag() === true) {
    const secret = process.env.DEMO_AUTH_SECRET?.trim() ?? "";
    if (
      secret.length < MIN_DEMO_SECRET_LENGTH ||
      secret === DEFAULT_DEMO_SECRET ||
      secret === EXAMPLE_DEMO_SECRET
    ) {
      return `DEMO_MODE=true en producción requiere DEMO_AUTH_SECRET de al menos ${MIN_DEMO_SECRET_LENGTH} caracteres y distinto de los valores de ejemplo.`;
    }

    const password = process.env.DEMO_ADMIN_PASSWORD ?? "";
    if (password.length < 8 || password === DEFAULT_DEMO_PASSWORD) {
      return "DEMO_MODE=true en producción requiere una DEMO_ADMIN_PASSWORD propia de al menos 8 caracteres.";
    }

    return null;
  }

  if (!isSupabaseConfigured()) {
    return "Falta configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. Para una demo explícita usá DEMO_MODE=true.";
  }

  return null;
}

export function assertRuntimeEnv() {
  const error = getRuntimeConfigError();
  if (error) {
    throw new Error(`[config] ${error}`);
  }
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

export const PRODUCT_IMAGES_BUCKET = "product-images";
