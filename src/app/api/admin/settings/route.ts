import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_PAGE_CACHE_TAG,
  LANDING_CACHE_TAG,
  updateSiteSettings,
} from "@/lib/data";

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
  brandPurpose: str.pipe(z.string().min(2)),
  primaryColor: str.pipe(z.string().regex(/^#([A-Fa-f0-9]{6})$/)),
  secondaryColor: str.pipe(z.string().regex(/^#([A-Fa-f0-9]{6})$/)),
  accentColor: str.pipe(z.string().regex(/^#([A-Fa-f0-9]{6})$/)),
  contactEmail: str.pipe(z.string().email().or(z.literal(""))),
  contactWhatsapp: str,
  seoTitle: str,
  seoDescription: str,
  seoKeywords: str,
  heroImageUrl: str.refine(isValidHeroOrAssetUrl, {
    message: "heroImageUrl: kosong, URL https://…, atau path /uploads/…",
  }),
  talentGalleryJson: str,
  locationAddress: str,
  mapsUrl: str
    .transform((s) => normalizeHttpsUrl(String(s)))
    .refine(isValidMapsOrEmpty, {
      message: "mapsUrl: kosong atau URL valid (contoh https://maps.google.com/…)",
    }),
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

    const updated = await updateSiteSettings({
      siteName: payload.siteName,
      tagline: payload.tagline,
      brandPurpose: payload.brandPurpose,
      primaryColor: payload.primaryColor,
      secondaryColor: payload.secondaryColor,
      accentColor: payload.accentColor,
      contactEmail: payload.contactEmail || null,
      contactWhatsapp: payload.contactWhatsapp.trim() || null,
      seoTitle: payload.seoTitle.trim() || null,
      seoDescription: payload.seoDescription.trim() || null,
      seoKeywords: payload.seoKeywords.trim() || null,
      heroImageUrl: payload.heroImageUrl.trim() || null,
      talentGalleryJson: payload.talentGalleryJson.trim() || null,
      locationAddress: payload.locationAddress.trim() || null,
      mapsUrl: payload.mapsUrl.trim() || null,
    });

    revalidateTag(LANDING_CACHE_TAG);
    revalidateTag(ADMIN_PAGE_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[settings PUT]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
