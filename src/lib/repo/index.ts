import { isDemoMode } from "@/lib/env";
import { demoRepo } from "@/lib/repo/demo";
import { supabaseRepo } from "@/lib/repo/supabase";
import type { CatalogRepo } from "@/lib/repo/types";

/**
 * Selector del backend. Con Supabase configurado usa PostgreSQL + RLS.
 * Sin credenciales usa el modo demo local para poder probar la app.
 */
export function getRepo(): CatalogRepo {
  return isDemoMode() ? demoRepo : supabaseRepo;
}
