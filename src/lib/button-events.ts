/**
 * Katalog tombol yang bisa di-track + event iklan yang dikirim saat diklik.
 * Tombol di halaman ditandai `data-track="<key>"`; pengaturan per tombol disimpan
 * di SiteSettings.buttonEventsJson dan bisa diubah dari Admin → Tracking iklan.
 */

export const BUTTON_EVENT_KINDS = [
  "none",
  "Lead",
  "Contact",
  "ViewContent",
  "Schedule",
  "FindLocation",
  "custom",
] as const;

export type ButtonEventKind = (typeof BUTTON_EVENT_KINDS)[number];

export type ButtonEventConfig = {
  event: ButtonEventKind;
  /** Wajib kalau event = "custom", mis. "klik_pricelist". */
  customName?: string;
  /** Opsional: Google Ads conversion send_to khusus tombol ini. */
  googleAdsSendTo?: string;
};

export type TrackableButton = {
  key: string;
  label: string;
  where: string;
  defaultEvent: ButtonEventKind;
};

export const TRACKABLE_BUTTONS: readonly TrackableButton[] = [
  { key: "hero_cta_primary", label: "Tombol utama hero", where: "Hero, mis. \"Konsultasi\"", defaultEvent: "none" },
  { key: "hero_cta_secondary", label: "Tombol kedua hero", where: "Hero, mis. \"Layanan\"", defaultEvent: "none" },
  { key: "pricelist", label: "Pricelist", where: "Hero & section kontak", defaultEvent: "none" },
  { key: "whatsapp_float", label: "WhatsApp melayang", where: "Pojok bawah layar", defaultEvent: "Contact" },
  { key: "whatsapp_contact", label: "Chat WhatsApp", where: "Section kontak", defaultEvent: "Contact" },
  { key: "email_contact", label: "Email", where: "Section kontak", defaultEvent: "none" },
  { key: "maps", label: "Buka di Maps", where: "Section kontak", defaultEvent: "none" },
  { key: "article", label: "Link artikel", where: "Section edukasi", defaultEvent: "none" },
  { key: "nav", label: "Menu navigasi", where: "Header atas", defaultEvent: "none" },
  { key: "lead_submit", label: "Tombol kirim brief", where: "Form kontak (saat diklik, sebelum terkirim)", defaultEvent: "none" },
];

export const BUTTON_EVENT_LABELS: Record<ButtonEventKind, string> = {
  none: "Hanya dicatat",
  Lead: "Lead",
  Contact: "Contact",
  ViewContent: "ViewContent (lihat konten)",
  Schedule: "Schedule (bikin janji)",
  FindLocation: "FindLocation (cari lokasi)",
  custom: "Event custom…",
};

/** Nama event custom: huruf kecil/angka/underscore — aman untuk semua platform. */
export const CUSTOM_EVENT_NAME = /^[a-z][a-z0-9_]{1,39}$/;

const SEND_TO = /^AW-\d{6,15}\/[A-Za-z0-9_-]{4,64}$/;

export type ButtonEventsMap = Record<string, ButtonEventConfig>;

/** Parse JSON dari DB; entri tidak dikenal/rusak dibuang diam-diam. */
export function parseButtonEvents(raw: string | null | undefined): ButtonEventsMap {
  if (!raw?.trim()) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const known = new Set(TRACKABLE_BUTTONS.map((b) => b.key));
  const out: ButtonEventsMap = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (!known.has(key) || !value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    if (!BUTTON_EVENT_KINDS.includes(v.event as ButtonEventKind)) continue;
    out[key] = {
      event: v.event as ButtonEventKind,
      ...(typeof v.customName === "string" && v.customName ? { customName: v.customName } : {}),
      ...(typeof v.googleAdsSendTo === "string" && v.googleAdsSendTo
        ? { googleAdsSendTo: v.googleAdsSendTo }
        : {}),
    };
  }
  return out;
}

/** Pengaturan efektif satu tombol (pakai default katalog kalau belum diatur). */
export function resolveButtonEvent(map: ButtonEventsMap, key: string): ButtonEventConfig {
  const fromMap = map[key];
  if (fromMap) return fromMap;
  const def = TRACKABLE_BUTTONS.find((b) => b.key === key);
  return { event: def?.defaultEvent ?? "none" };
}

/** Pesan error per tombol (untuk validasi API & admin). Kosong = valid. */
export function buttonEventsIssues(raw: string | null | undefined): string[] {
  const map = parseButtonEvents(raw);
  const issues: string[] = [];
  for (const b of TRACKABLE_BUTTONS) {
    const c = map[b.key];
    if (!c) continue;
    if (c.event === "custom" && !CUSTOM_EVENT_NAME.test(c.customName ?? "")) {
      issues.push(`${b.label}: nama event custom pakai huruf kecil, angka, atau _ (mis. klik_pricelist)`);
    }
    if (c.googleAdsSendTo && !SEND_TO.test(c.googleAdsSendTo)) {
      issues.push(`${b.label}: label Google Ads harus berformat AW-123456789/AbCdEf`);
    }
  }
  return issues;
}

/** Simpan hanya yang beda dari default supaya JSON tetap kecil. */
export function serializeButtonEvents(map: ButtonEventsMap): string | null {
  const out: ButtonEventsMap = {};
  for (const b of TRACKABLE_BUTTONS) {
    const c = map[b.key];
    if (!c) continue;
    const isDefault = c.event === b.defaultEvent && !c.customName && !c.googleAdsSendTo;
    if (isDefault) continue;
    out[b.key] = {
      event: c.event,
      ...(c.event === "custom" && c.customName ? { customName: c.customName } : {}),
      ...(c.event !== "none" && c.googleAdsSendTo ? { googleAdsSendTo: c.googleAdsSendTo } : {}),
    };
  }
  return Object.keys(out).length ? JSON.stringify(out) : null;
}
