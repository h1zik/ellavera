import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_PAGE_CACHE_TAG } from "@/lib/data";
import { prisma } from "@/lib/prisma";

const leadSchema = z.object({
  fullName: z.string().min(2),
  brandName: z.string().optional().default(""),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  message: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const payload = leadSchema.parse(await request.json());

    const lead = await prisma.lead.create({
      data: {
        fullName: payload.fullName,
        brandName: payload.brandName || null,
        email: payload.email,
        phone: payload.phone || null,
        message: payload.message,
      },
    });

    revalidateTag(ADMIN_PAGE_CACHE_TAG);
    revalidatePath("/admin");

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid payload" },
      { status: 400 },
    );
  }
}
