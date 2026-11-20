#!/usr/bin/env node
/**
 * Crea (o reutiliza) el primer usuario administrador en Supabase y lo habilita
 * en public.admin_users.
 *
 * Uso:
 *   npm run seed:admin -- --email admin@tienda.com --password "secreto-largo"
 *
 * También se puede configurar por variables de entorno:
 *   ADMIN_EMAIL=admin@tienda.com ADMIN_PASSWORD="secreto-largo" npm run seed:admin
 *
 * Requiere en .env.local (o en el entorno):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (solo servidor, nunca en el cliente)
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

// Node 20.6+ permite cargar archivos .env sin dependencias extra.
for (const file of [".env.local", ".env"]) {
  const fullPath = path.resolve(process.cwd(), file);
  if (existsSync(fullPath) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(fullPath);
  }
}

function readArg(name) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1) return process.argv[index + 1];
  return undefined;
}

const email = (readArg("email") ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = readArg("password") ?? process.env.ADMIN_PASSWORD ?? "";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!url || !/^https?:\/\//.test(url) || url.includes("TU-PROYECTO")) {
  fail(
    "Falta NEXT_PUBLIC_SUPABASE_URL válida. Copiá .env.example a .env.local y completá los datos del proyecto.",
  );
}

if (!serviceKey) {
  fail(
    "Falta SUPABASE_SERVICE_ROLE_KEY. Es una clave SOLO de servidor: no la expongas con prefijo NEXT_PUBLIC_.",
  );
}

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail("Indicá un email válido: npm run seed:admin -- --email admin@tienda.com --password \"...\"");
}

if (password.length < 8) {
  fail("La contraseña debe tener al menos 8 caracteres.");
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 200;

  while (page <= 50) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === targetEmail,
    );
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

async function main() {
  console.log(`\n▸ Configurando administrador ${email} en ${url}\n`);

  let user = await findUserByEmail(email);

  if (user) {
    console.log("• El usuario ya existe en Auth; se actualizará su contraseña y se confirmará el email.");
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  } else {
    console.log("• Creando usuario en Supabase Auth…");
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  }

  if (!user) throw new Error("Supabase no devolvió el usuario creado.");

  const { error: adminError } = await supabase
    .from("admin_users")
    .upsert({ user_id: user.id, email }, { onConflict: "user_id" });
  if (adminError) throw adminError;

  // Garantiza que exista la fila única de configuración de la tienda.
  const { error: settingsError } = await supabase
    .from("site_settings")
    .upsert({ id: true }, { onConflict: "id", ignoreDuplicates: true });
  if (settingsError) throw settingsError;

  console.log("\n✔ Administrador habilitado.");
  console.log(`  Email:    ${email}`);
  console.log("  Password: (la que indicaste)");
  console.log("  Ingresá en /login y luego a /admin/productos.\n");
}

main().catch((error) => {
  console.error("\n✖ No se pudo crear el administrador.");
  console.error(`  ${error?.message ?? error}\n`);
  process.exit(1);
});
