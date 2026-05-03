import { NextResponse } from "next/server";
import { z } from "zod";
import { updateSiteSettings } from "@/lib/data";

const settingsSchema = z.object({
  siteName: z.string().min(2),
  tagline: z.string().min(2),
  brandPurpose: z.string().min(5),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  contactEmail: z.string().email().or(z.literal("")),
  contactWhatsapp: z.string().optional().default(""),
  seoTitle: z.string().optional().default(""),
  seoDescription: z.string().optional().default(""),
  seoKeywords: z.string().optional().default(""),
  heroImageUrl: z.string().url().or(z.literal("")),
});

export async function PUT(request: Request) {
  try {
    const payload = settingsSchema.parse(await request.json());
    const updated = await updateSiteSettings({
      ...payload,
      contactEmail: payload.contactEmail || null,
      contactWhatsapp: payload.contactWhatsapp || null,
      seoTitle: payload.seoTitle || null,
      seoDescription: payload.seoDescription || null,
      seoKeywords: payload.seoKeywords || null,
      heroImageUrl: payload.heroImageUrl || null,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
}
