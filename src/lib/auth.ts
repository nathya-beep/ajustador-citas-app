import type { NextRequest } from "next/server";
import crypto from "crypto";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

export function createSessionToken(): string {
  const issuedAt = Date.now().toString();
  const signature = crypto.createHmac("sha256", getSecret()).update(issuedAt).digest("hex");
  return `${issuedAt}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const expectedSignature = crypto.createHmac("sha256", getSecret()).update(issuedAt).digest("hex");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) return false;

  const isValidSignature = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  const isNotExpired = Date.now() - Number(issuedAt) < SESSION_MAX_AGE_MS;

  return isValidSignature && isNotExpired;
}

export async function requireAdminSession(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return false;
    return verifySessionToken(token);
  } catch {
    return false;
  }
}
