import { DEFAULT_DEMO_PASSWORD, DEFAULT_DEMO_SECRET } from "@/lib/env";

export const DEMO_COOKIE = "nicolini_demo_session";

function getSecret() {
  return process.env.DEMO_AUTH_SECRET ?? DEFAULT_DEMO_SECRET;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

export async function createDemoSessionToken(email: string) {
  const payload = toBase64Url(new TextEncoder().encode(email));
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifyDemoSessionToken(token: string | undefined | null) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = await sign(payload);
  if (expected !== signature) return null;
  try {
    const email = new TextDecoder().decode(fromBase64Url(payload));
    return email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

export function getDemoCredentials() {
  return {
    email: process.env.DEMO_ADMIN_EMAIL ?? "demo@nicoliniimport.com",
    password: process.env.DEMO_ADMIN_PASSWORD ?? DEFAULT_DEMO_PASSWORD,
  };
}
