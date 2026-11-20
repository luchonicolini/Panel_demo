import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

let publicClient: SupabaseClient | null = null;

/**
 * Cliente anónimo para el catálogo público. No usa cookies ni claves
 * privilegiadas: las políticas RLS solo permiten leer productos publicados.
 */
export function getSupabasePublicClient() {
  if (!publicClient) {
    publicClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return publicClient;
}
