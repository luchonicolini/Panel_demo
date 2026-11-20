"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDemoCredentials, DEMO_COOKIE, createDemoSessionToken } from "@/lib/demo-session";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError, loginSchema } from "@/lib/validation";

export type LoginState = { error?: string } | null;

function safeNext(value: FormDataEntryValue | null) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/admin/productos";
}

export async function signInAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const next = safeNext(formData.get("next"));

  if (isDemoMode()) {
    const credentials = getDemoCredentials();
    const emailMatches =
      parsed.data.email.toLowerCase() === credentials.email.toLowerCase();
    if (!emailMatches || parsed.data.password !== credentials.password) {
      return { error: "Email o contraseña incorrectos." };
    }

    const token = await createDemoSessionToken(credentials.email);
    const cookieStore = await cookies();
    cookieStore.set(DEMO_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect(next);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: "Email o contraseña incorrectos." };
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return {
      error: "Tu usuario no tiene permisos de administración. Pedile acceso al dueño de la tienda.",
    };
  }

  redirect(next);
}

export async function signOutAction() {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_COOKIE);
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
