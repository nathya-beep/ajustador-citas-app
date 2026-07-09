import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

/**
 * Credenciales del panel definidas EN LA APP (no dependen de Vercel).
 * La contraseña NO se guarda en texto plano: se verifica contra un hash scrypt
 * con sal (resistente a fuerza bruta aunque el repo sea público).
 *
 * Para cambiar la contraseña: genera un nuevo par sal/hash con
 *   node -e "const c=require('crypto');const s=c.randomBytes(16).toString('hex');console.log('salt',s);console.log('hash',c.scryptSync('TU_NUEVA_CLAVE',s,64).toString('hex'))"
 * y reemplaza APP_ADMIN_SALT y APP_ADMIN_PASSWORD_HASH.
 */
const APP_ADMIN_EMAIL = "admin@inspectpro.com";
const APP_ADMIN_SALT = "0efe8ea939efd7e81eb963590ce82b5c";
const APP_ADMIN_PASSWORD_HASH =
  "f579b5e697ddd07f5bf93eacdc63713bf03915297a241f58779802491066bb784f1d3fbf3ecc9a8058abfbfb7d08682357322002748109a18f767d5d8773d410";

function verifyAppPassword(password: string): boolean {
  try {
    const derived = crypto.scryptSync(password, APP_ADMIN_SALT, 64).toString("hex");
    const a = Buffer.from(derived);
    const b = Buffer.from(APP_ADMIN_PASSWORD_HASH);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  // 1) Credenciales de la app (scrypt). 2) Credenciales de Vercel (compatibilidad).
  const isAppLogin = normalizedEmail === APP_ADMIN_EMAIL && typeof password === "string" && verifyAppPassword(password);
  const isEnvLogin =
    !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;

  if (!isAppLogin && !isEnvLogin) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
