/**
 * Verifikasi token sesi admin di Edge (middleware). Harus sinkron dengan `admin-session.ts` (Node).
 */

function base64UrlToUint8Array(b64url: string): Uint8Array {
  const pad = b64url.length % 4;
  const padded =
    b64url.replace(/-/g, "+").replace(/_/g, "/") + (pad ? "=".repeat(4 - pad) : "");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  const b64 = btoa(s);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return uint8ArrayToBase64Url(new Uint8Array(sig));
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let z = 0;
  for (let i = 0; i < a.length; i++) z |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return z === 0;
}

export function getAdminSessionSecretEdge(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "ellavera-dev-change-admin-session-secret"
  );
}

export async function verifyAdminSessionTokenEdge(token: string | undefined): Promise<boolean> {
  try {
    if (!token?.includes(".")) return false;
    const lastDot = token.lastIndexOf(".");
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const secret = getAdminSessionSecretEdge();
    if (!secret) return false;
    const expected = await hmacSha256Base64Url(secret, payload);
    if (!timingSafeEqualStr(sig, expected)) return false;
    const json = new TextDecoder().decode(base64UrlToUint8Array(payload));
    const { exp } = JSON.parse(json) as { exp?: unknown };
    return typeof exp === "number" && Math.floor(Date.now() / 1000) < exp;
  } catch {
    /* Cookie korup / base64 invalid → anggap belum login; jangan biarkan middleware throw (bisa 503). */
    return false;
  }
}
