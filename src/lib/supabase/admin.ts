import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/env";

/**
 * Cliente con service role. Solo se debe importar desde scripts del servidor
 * o tareas administrativas. Nunca desde componentes cliente.
 */
export function createSupabaseAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.");
  }
  return createClient(getSupabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
