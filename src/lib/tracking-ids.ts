/**
 * Validasi format ID tracking iklan. Dipakai API admin (tolak input salah) dan
 * <TrackingScripts> (lapisan kedua sebelum ID ditanam ke inline script).
 */

export const TRACKING_ID_PATTERNS = {
  /** Meta Pixel: angka. */
  meta: /^\d{6,20}$/,
  /** OpenAI (ChatGPT Ads) Pixel, mis. 4Z2Ks9o7mVYepwJ9K7BNXh. */
  openai: /^[A-Za-z0-9_-]{8,64}$/,
  /** Satu Google tag ID: GA4 (G-), Google Ads (AW-), Google tag (GT-), Floodlight (DC-). */
  googleTag: /^(G|AW|GT|DC)-[A-Z0-9]{4,20}$/,
  /** Google Ads conversion send_to: AW-123456789/AbCdEfGh123. */
  googleAdsSendTo: /^AW-\d{6,15}\/[A-Za-z0-9_-]{4,64}$/,
  gtm: /^GTM-[A-Z0-9]{4,12}$/,
  tiktok: /^[A-Z0-9]{10,32}$/,
} as const;

/** "G-abc, AW-123  aw-123" → ["G-ABC", "AW-123"] (uppercase, unik). */
export function parseGoogleTagIds(raw: string | null | undefined): string[] {
  const ids = (raw ?? "")
    .split(/[\s,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return Array.from(new Set(ids));
}

export function invalidGoogleTagIds(raw: string): string[] {
  return parseGoogleTagIds(raw).filter((id) => !TRACKING_ID_PATTERNS.googleTag.test(id));
}

/** Prefix "AW-123456789" dari send_to "AW-123456789/label". */
export function googleAdsIdFromSendTo(sendTo: string): string {
  return sendTo.split("/")[0] ?? "";
}

/** Kembalikan ID yang sudah di-trim bila cocok pola; selain itu null. */
export function validTrackingId(
  raw: string | null | undefined,
  pattern: RegExp,
): string | null {
  const id = raw?.trim();
  return id && pattern.test(id) ? id : null;
}
