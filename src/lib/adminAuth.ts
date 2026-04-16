import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function getSecret(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD not set");
  return pw;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionCookie(): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = String(exp);
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySession(): boolean {
  try {
    const cookie = cookies().get(COOKIE_NAME);
    if (!cookie?.value) return false;
    const [payload, sig] = cookie.value.split(".");
    if (!payload || !sig) return false;
    const expected = sign(payload);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const exp = Number(payload);
    return !isNaN(exp) && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export { COOKIE_NAME, MAX_AGE };
