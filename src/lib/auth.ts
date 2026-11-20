import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_COOKIE, verifyDemoSessionToken } from "@/lib/demo-session";

export type AdminUser = {
  id: string;
  email: string;
};

export async function getAdminUser(): Promise<AdminUser | null> {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const email = await verifyDemoSessionToken(cookieStore.get(DEMO_COOKIE)?.value);
    return email ? { id: "demo-admin", email } : null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) return null;

  return { id: user.id, email: user.email ?? "" };
}

export async function requireAdmin(nextPath = "/admin/productos"): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}
