/**
 * Helper tracking iklan untuk komponen client: satu panggilan → dikirim ke semua
 * platform yang aktif (Meta, OpenAI/ChatGPT Ads, Google tag/Ads, TikTok, GTM).
 * Aman dipanggil kapan saja — platform yang belum ter-load / tidak diisi di admin dilewati.
 */

import {
  resolveButtonEvent,
  type ButtonEventKind,
  type ButtonEventsMap,
} from "@/lib/button-events";

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
    /** Diisi oleh <TrackingScripts> — event per tombol dari admin. */
    __ellaveraButtons?: ButtonEventsMap;
  }
}

type ConversionKind = Exclude<ButtonEventKind, "none">;

type Context = {
  /** Kunci tombol (data-track), mis. "pricelist". */
  source: string;
  label?: string;
  customName?: string;
  googleAdsSendTo?: string;
};

/** Jalankan satu pemanggilan platform; error tracking tidak boleh memutus UX. */
function safe(run: () => void): void {
  try {
    run();
  } catch {
    /* ignore */
  }
}

/** Nama event per platform untuk tiap jenis konversi. */
function send(kind: ConversionKind, ctx: Context): void {
  const w = window;
  const name = kind === "custom" ? ctx.customName : undefined;
  if (kind === "custom" && !name) return;

  safe(() => {
    if (!w.fbq) return;
    if (name) w.fbq("trackCustom", name, { button: ctx.source });
    else w.fbq("track", kind);
  });

  safe(() => {
    if (!w.oaiq) return;
    const custom = (n: string) =>
      w.oaiq!("measure", "custom", { type: "custom" }, { custom_event_name: n });
    if (kind === "Lead") w.oaiq("measure", "lead_created", { type: "customer_action" });
    else if (kind === "Schedule") w.oaiq("measure", "appointment_scheduled", { type: "customer_action" });
    else if (kind === "ViewContent")
      w.oaiq("measure", "contents_viewed", {
        type: "contents",
        contents: [{ id: ctx.source, name: ctx.label || ctx.source, content_type: "page" }],
      });
    // OpenAI tidak punya event standar contact → custom (nama lama dipertahankan untuk WhatsApp).
    else if (kind === "Contact")
      custom(ctx.source.startsWith("whatsapp") ? "contact_whatsapp" : `contact_${ctx.source}`);
    else if (kind === "FindLocation") custom("find_location");
    else if (name) custom(name);
  });

  safe(() => {
    if (!w.gtag) return;
    const gaName =
      name ??
      {
        Lead: "generate_lead",
        Contact: "contact",
        ViewContent: "select_content",
        Schedule: "schedule",
        FindLocation: "find_location",
      }[kind as Exclude<ConversionKind, "custom">];
    w.gtag("event", gaName, { button_id: ctx.source, button_label: ctx.label });
    const sendTo =
      ctx.googleAdsSendTo ||
      (kind === "Lead" ? w.__ellaveraAds?.lead : kind === "Contact" ? w.__ellaveraAds?.contact : "");
    if (sendTo) w.gtag("event", "conversion", { send_to: sendTo });
  });

  safe(() => {
    if (!w.ttq) return;
    w.ttq.track(name ?? (kind === "Lead" ? "SubmitForm" : kind), { content_name: ctx.label || ctx.source });
  });

  // Untuk trigger di Google Tag Manager (Custom Event: ellavera_lead, ellavera_contact, …).
  safe(() => {
    w.dataLayer?.push({
      event: `ellavera_${(name ?? kind).toLowerCase()}`,
      button_id: ctx.source,
      button_label: ctx.label,
    });
  });
}

/** Form brief berhasil terkirim. */
export function trackLead(): void {
  if (typeof window === "undefined") return;
  send("Lead", { source: "lead_form", label: "Form brief" });
}

/**
 * Klik tombol bertanda `data-track`. Selalu dicatat sebagai `button_click`
 * (Analytics/GTM), lalu event iklan sesuai pengaturan tombol di admin.
 */
export function trackButtonClick(key: string, label?: string): void {
  if (typeof window === "undefined") return;
  const w = window;

  safe(() => w.gtag?.("event", "button_click", { button_id: key, button_label: label }));
  safe(() => w.dataLayer?.push({ event: "ellavera_click", button_id: key, button_label: label }));

  const config = resolveButtonEvent(w.__ellaveraButtons ?? {}, key);
  if (config.event === "none") return;
  send(config.event, {
    source: key,
    label,
    customName: config.customName,
    googleAdsSendTo: config.googleAdsSendTo,
  });
}
