import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ADMIN_PAGE_CACHE_TAG } from "@/lib/data";
import { buildLeadEmail, parseRecipientList } from "@/lib/lead-email";
import {
  buildLeadSubmissionSchema,
  deriveLegacyLeadColumns,
  parseLeadFormFieldsJson,
} from "@/lib/lead-form-config";
import { sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: {
        leadFormFieldsJson: true,
        leadNotifyEmail: true,
        contactEmail: true,
        siteName: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
        smtpPasswordEnc: true,
        smtpFrom: true,
      },
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

    // Lead sudah tersimpan; kegagalan email tidak boleh membatalkan submit.
    const recipients = parseRecipientList(
      settings?.leadNotifyEmail?.trim() || settings?.contactEmail || "",
    );
    if (recipients.length > 0) {
      const mail = buildLeadEmail({
        fields,
        data,
        siteName: settings?.siteName || "Ellavera",
        submitterName: legacy.fullName,
        submitterEmail: legacy.email,
        leadId: lead.id,
      });
      const sent = await sendMail({
        settingsRow: settings ?? null,
        to: recipients.join(", "),
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        replyTo: legacy.email,
      });
      if (!sent.ok) {
        console.error("[leads POST] notifikasi email gagal:", sent.reason, sent.detail ?? "");
      }
    } else {
      console.warn("[leads POST] tidak ada email penerima — set di Admin > Pengaturan situs.");
    }

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
