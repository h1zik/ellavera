/**
 * Helper tracking iklan untuk komponen client: satu panggilan → dikirim ke semua
 * platform yang aktif (Meta, OpenAI/ChatGPT Ads, Google tag/Ads, TikTok, GTM).
 * Aman dipanggil kapan saja — platform yang belum ter-load / tidak diisi di admin dilewati.
 */

type Fn = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fn;
    oaiq?: Fn;
    gtag?: Fn;
    ttq?: { track: Fn };
    dataLayer?: unknown[];
    /** Diisi oleh <TrackingScripts> — label konversi Google Ads per event. */
    __ellaveraAds?: { lead?: string; contact?: string };
  }
}

type ConversionKind = "lead" | "contact";

function fire(kind: ConversionKind): void {
  if (typeof window === "undefined") {
    return;
  }
  const w = window;
  const isLead = kind === "lead";

  try {
    w.fbq?.("track", isLead ? "Lead" : "Contact");
  } catch {
    /* jangan sampai error tracking memutus UX */
  }

  try {
    if (isLead) {
      w.oaiq?.("measure", "lead_created", { type: "customer_action" });
    } else {
      // OpenAI belum punya event standar "contact" → custom event.
      w.oaiq?.("measure", "custom", { type: "custom" }, { custom_event_name: "contact_whatsapp" });
    }
  } catch {
    /* ignore */
  }

  try {
    if (w.gtag) {
      if (isLead) {
        w.gtag("event", "generate_lead");
      } else {
        w.gtag("event", "contact", { method: "whatsapp" });
      }
      const sendTo = isLead ? w.__ellaveraAds?.lead : w.__ellaveraAds?.contact;
      if (sendTo) {
        w.gtag("event", "conversion", { send_to: sendTo });
      }
    }
  } catch {
    /* ignore */
  }

  try {
    w.ttq?.track(isLead ? "SubmitForm" : "Contact");
  } catch {
    /* ignore */
  }

  // Untuk trigger di Google Tag Manager (Custom Event: ellavera_lead / ellavera_contact).
  try {
    w.dataLayer?.push({ event: isLead ? "ellavera_lead" : "ellavera_contact" });
  } catch {
    /* ignore */
  }
}

/** Form brief berhasil terkirim. */
export function trackLead(): void {
  fire("lead");
}

/** Klik tombol / tautan WhatsApp. */
export function trackContact(): void {
  fire("contact");
}
