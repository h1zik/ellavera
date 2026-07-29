import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/**
 * Enkripsi rahasia (password SMTP) sebelum masuk database.
 *
 * Kunci diambil dari env `SMTP_CRYPT_KEY` (bebas, minimal 16 karakter). Kalau
 * env itu tidak diset, nilai disimpan apa adanya dengan penanda `plain:` —
 * fungsional, tapi tidak terlindungi kalau dump database bocor. Status ini
 * ditampilkan di panel admin supaya bisa dibenahi.
 */
const ENC_PREFIX = "enc:v1:";
const PLAIN_PREFIX = "plain:";
const SALT = "ellavera-smtp-v1";

function readKey(): Buffer | null {
  const raw = process.env.SMTP_CRYPT_KEY?.trim();
  if (!raw || raw.length < 16) {
    return null;
  }
  return scryptSync(raw, SALT, 32);
}

export function isEncryptionAvailable(): boolean {
  return readKey() !== null;
}

export function encryptSecret(plain: string): string {
  const value = plain ?? "";
  if (!value) {
    return "";
  }
  const key = readKey();
  if (!key) {
    return `${PLAIN_PREFIX}${value}`;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(stored: string | null | undefined): string {
  const raw = stored?.trim();
  if (!raw) {
    return "";
  }
  if (raw.startsWith(PLAIN_PREFIX)) {
    return raw.slice(PLAIN_PREFIX.length);
  }
  if (!raw.startsWith(ENC_PREFIX)) {
    // Nilai lama tanpa penanda — perlakukan sebagai teks biasa.
    return raw;
  }
  const key = readKey();
  if (!key) {
    return "";
  }
  const [ivB64, tagB64, dataB64] = raw.slice(ENC_PREFIX.length).split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    return "";
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // Kunci berubah / data rusak → anggap belum ada password.
    return "";
  }
}

/** Perbandingan tanpa timing leak — dipakai kalau perlu cek nilai rahasia. */
export function secretEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
