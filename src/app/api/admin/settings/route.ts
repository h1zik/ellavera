import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_PAGE_CACHE_TAG,
  LANDING_CACHE_TAG,
  updateSiteSettings,
} from "@/lib/data";
import { toAdminSiteSettings } from "@/lib/admin-settings";
import { invalidRecipients, parseRecipientList } from "@/lib/lead-email";
import { encryptSecret } from "@/lib/secret-box";
import {
  DEFAULT_LEAD_FORM_FIELDS_JSON,
  leadFormFieldsJsonIssuesSummary,
} from "@/lib/lead-form-config";

/** Browser / Prisma sering kirim `null`; koersi ke string untuk Zod. */
const str = z.union([z.string(), z.null(), z.undefined()]).transform((v) => (v == null ? "" : String(v)));

function isValidHeroOrAssetUrl(s: string): boolean {
  if (s === "") {
    return true;
  }
  if (s.startsWith("/") && !s.startsWith("//")) {
    return true;
  }
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function isValidMapsOrEmpty(s: string): boolean {
  if (s === "") {
    return true;
  }
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function normalizeHttpsUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

const settingsSchema = z.object({
  siteName: str.pipe(z.string().min(2)),
  tagline: str.pipe(z.string().min(2)),
  /** Boleh kosong = baris teks kecil disembunyikan di beranda. */
  headerEyebrow: str.pipe(z.string().max(120)),
  heroKicker: str.pipe(z.string().max(120)),
  brandPurpose: str.pipe(z.string().min(2)),
  primaryColor: str.pipe(z.string().regex(/^#([A-Fa-f0-9]{6})$/)),
  secondaryColor: str.pipe(z.string().regex(/^#([A-Fa-f0-9]{6})$/)),
  accentColor: str.pipe(z.string().regex(/^#([A-Fa-f0-9]{6})$/)),
  contactEmail: str.pipe(z.string().email().or(z.literal(""))),
  contactWhatsapp: str,
  smtpHost: str.pipe(z.string().max(200)),
  smtpPort: str.superRefine((s, ctx) => {
    const t = s.trim();
    if (t === "") return;
    const n = Number.parseInt(t, 10);
    if (!Number.isFinite(n) || n < 1 || n > 65535) {
      ctx.addIssue({ code: "custom", message: "Port SMTP harus angka 1–65535 (mis. 587 atau 465)" });
    }
  }),
  smtpSecure: z
    .union([z.literal("auto"), z.literal("true"), z.literal("false"), z.null(), z.undefined()])
    .transform((v) => v ?? "auto"),
  smtpUser: str.pipe(z.string().max(200)),
  /** Kosong = jangan ubah password yang tersimpan. */
  smtpPassword: str.pipe(z.string().max(400)),
  /** true = hapus password tersimpan. */
  smtpPasswordClear: z
    .union([z.boolean(), z.literal("true"), z.literal("false"), z.null(), z.undefined()])
    .transform((v) => v === true || v === "true"),
  smtpFrom: str.pipe(z.string().max(200)),
  leadNotifyEmail: str.superRefine((s, ctx) => {
    const bad = invalidRecipients(s);
    if (bad.length === 0) return;
    ctx.addIssue({
      code: "custom",
      message: `Email penerima tidak valid: ${bad.join(", ")} (pisahkan beberapa email dengan koma)`,
    });
  }),
  seoTitle: str,
  seoDescription: str,
  seoKeywords: str,
  metaPixelId: str
    .transform((s) => String(s).trim())
    .refine((s) => s === "" || /^\d{6,20}$/.test(s), {
      message: "metaPixelId: kosong atau hanya angka (ID Pixel Meta, ~15-16 digit)",
    }),
  heroImageUrl: str.refine(isValidHeroOrAssetUrl, {
    message: "heroImageUrl: kosong, URL https://…, atau path /uploads/…",
  }),
  adminLogoUrl: str.refine(isValidHeroOrAssetUrl, {
    message: "adminLogoUrl: kosong, URL https://…, atau path /uploads/…",
  }),
  faviconUrl: str.refine(isValidHeroOrAssetUrl, {
    message: "faviconUrl: kosong, URL https://…, atau path /uploads/…",
  }),
  siteLogoUrl: str.refine(isValidHeroOrAssetUrl, {
    message: "siteLogoUrl: kosong, URL https://…, atau path /uploads/…",
  }),
  talentGalleryJson: str,
  leadFormFieldsJson: str,
  locationAddress: str,
  mapsUrl: str
    .transform((s) => normalizeHttpsUrl(String(s)))
    .refine(isValidMapsOrEmpty, {
      message: "mapsUrl: kosong atau URL valid (contoh https://maps.google.com/…)",
    }),
})
  .superRefine((data, ctx) => {
    const summary = leadFormFieldsJsonIssuesSummary(data.leadFormFieldsJson);
    if (summary) {
      ctx.addIssue({
        code: "custom",
        message: `Form leads: ${summary}`,
        path: ["leadFormFieldsJson"],
      });
    }

    // Host & user harus berpasangan; kalau salah satu diisi, yang lain wajib.
    const host = data.smtpHost.trim();
    const user = data.smtpUser.trim();
    if (host && !user) {
      ctx.addIssue({
        code: "custom",
        message: "Host SMTP diisi tapi username kosong",
        path: ["smtpUser"],
      });
    }
    if (user && !host) {
      ctx.addIssue({
        code: "custom",
        message: "Username SMTP diisi tapi host kosong",
        path: ["smtpHost"],
      });
    }
  });

export async function PUT(request: Request) {
  try {
    const json = (await request.json()) as unknown;
    const parsed = settingsSchema.safeParse(json);

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return NextResponse.json(
        {
          error: "Validasi gagal",
          fieldErrors: flat.fieldErrors,
          formErrors: flat.formErrors,
        },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    /**
     * Password: kosong = pertahankan yang tersimpan (browser tidak pernah
     * menerima nilai aslinya), `smtpPasswordClear` = hapus.
     */
    const smtpPasswordEnc = payload.smtpPasswordClear
      ? null
      : payload.smtpPassword.trim()
        ? encryptSecret(payload.smtpPassword.trim())
        : undefined;

    const updated = await updateSiteSettings({
      siteName: payload.siteName,
      tagline: payload.tagline,
      headerEyebrow: payload.headerEyebrow.trim(),
      heroKicker: payload.heroKicker.trim(),
      brandPurpose: payload.brandPurpose,
      primaryColor: payload.primaryColor,
      secondaryColor: payload.secondaryColor,
      accentColor: payload.accentColor,
      contactEmail: payload.contactEmail || null,
      contactWhatsapp: payload.contactWhatsapp.trim() || null,
      leadNotifyEmail: parseRecipientList(payload.leadNotifyEmail).join(", ") || null,
      smtpHost: payload.smtpHost.trim() || null,
      smtpPort: payload.smtpPort.trim() ? Number.parseInt(payload.smtpPort.trim(), 10) : null,
      smtpSecure: payload.smtpSecure === "auto" ? null : payload.smtpSecure === "true",
      smtpUser: payload.smtpUser.trim() || null,
      smtpFrom: payload.smtpFrom.trim() || null,
      ...(smtpPasswordEnc === undefined ? {} : { smtpPasswordEnc }),
      seoTitle: payload.seoTitle.trim() || null,
      seoDescription: payload.seoDescription.trim() || null,
      seoKeywords: payload.seoKeywords.trim() || null,
      metaPixelId: payload.metaPixelId.trim() || null,
      heroImageUrl: payload.heroImageUrl.trim() || null,
      adminLogoUrl: payload.adminLogoUrl.trim() || null,
      faviconUrl: payload.faviconUrl.trim() || null,
      siteLogoUrl: payload.siteLogoUrl.trim() || null,
      talentGalleryJson: payload.talentGalleryJson.trim() || null,
      leadFormFieldsJson:
        payload.leadFormFieldsJson.trim() || DEFAULT_LEAD_FORM_FIELDS_JSON,
      locationAddress: payload.locationAddress.trim() || null,
      mapsUrl: payload.mapsUrl.trim() || null,
    });

    revalidateTag(LANDING_CACHE_TAG);
    revalidateTag(ADMIN_PAGE_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json(toAdminSiteSettings(updated));
  } catch (e) {
    console.error("[settings PUT]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
