import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ADMIN_PAGE_CACHE_TAG } from "@/lib/data";
import {
  buildLeadSubmissionSchema,
  deriveLegacyLeadColumns,
  parseLeadFormFieldsJson,
} from "@/lib/lead-form-config";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: { leadFormFieldsJson: true },
    });

    const fields = parseLeadFormFieldsJson(settings?.leadFormFieldsJson);
    const schema = buildLeadSubmissionSchema(fields);

    const raw = (await request.json()) as Record<string, unknown>;
    const strOnly: Record<string, string> = {};
    for (const f of fields) {
      const v = raw[f.id];
      strOnly[f.id] = v == null ? "" : String(v);
    }

    const data = schema.parse(strOnly);
    const legacy = deriveLegacyLeadColumns(fields, data);

    const lead = await prisma.lead.create({
      data: {
        fullName: legacy.fullName,
        brandName: legacy.brandName,
        email: legacy.email,
        phone: legacy.phone,
        message: legacy.message,
        responsesJson: JSON.stringify(data),
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
