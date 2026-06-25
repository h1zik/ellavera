/** Helper Meta (Facebook) Pixel untuk komponen client. */

type FbqParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Kirim event standar ke Meta Pixel jika sudah ter-load.
 * Aman dipanggil kapan saja — no-op saat SSR atau pixel belum aktif.
 */
export function trackPixel(event: string, params?: FbqParams): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }
  if (params) {
    window.fbq("track", event, params);
  } else {
    window.fbq("track", event);
  }
}
