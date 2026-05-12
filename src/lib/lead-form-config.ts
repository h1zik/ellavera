import { z } from "zod";

export type LeadFieldType = "text" | "email" | "tel" | "textarea";

export type LeadFormField = {
  id: string;
  label: string;
  type: LeadFieldType;
  required: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
};

const FIELD_ID_RE = /^[a-z][a-z0-9_]{0,48}$/;

function describeInvalidFieldId(raw: string): string {
  const id = raw.trim().toLowerCase();
  if (!id) {
    return "Id kosong — wajib diisi. Contoh: email, nama_lengkap, nomor_wa.";
  }
  if (!/^[a-z]/.test(id)) {
    return `Id "${raw}" harus diawali huruf kecil (a–z), bukan angka, simbol, atau underscore. Contoh: ubah "1nama" → "nama1", "_wa" → "wa".`;
  }
  if (/[^a-z0-9_]/.test(id)) {
    return `Id "${raw}" hanya boleh huruf kecil, angka, dan garis bawah (_). Jangan pakai spasi, strip (-), titik, atau huruf besar.`;
  }
  if (id.length > 49) {
    return `Id terlalu panjang (maks. 49 karakter).`;
  }
  return `Id "${raw}" tidak valid.`;
}

/** API / klien kadang kirim boolean sebagai 0/1 atau string — diterima. */
const booleanFromJson = z.preprocess((v: unknown) => {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return v;
}, z.boolean());

const fieldSchema = z.object({
  id: z.preprocess(
    (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.string(),
  ),
  label: z.string().trim().min(1).max(120),
  type: z.enum(["text", "email", "tel", "textarea"]),
  required: booleanFromJson,
  placeholder: z.string().max(200).optional(),
  minLength: z.number().int().min(1).max(5000).optional(),
  maxLength: z.number().int().min(1).max(10000).optional(),
});

export const leadFormFieldsArraySchema = z
  .array(fieldSchema)
  .min(1, "Minimal satu field")
  .max(15, "Maksimal 15 field")
  .superRefine((fields, ctx) => {
    fields.forEach((f, i) => {
      const id = typeof f.id === "string" ? f.id.trim().toLowerCase() : "";
      if (!FIELD_ID_RE.test(id)) {
        ctx.addIssue({
          code: "custom",
          message: `Baris ${i + 1} (“${f.label}”): ${describeInvalidFieldId(f.id ?? "")}`,
        });
      }
    });

    const ids = fields.map((f) => (typeof f.id === "string" ? f.id.trim().toLowerCase() : ""));
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "Setiap id field harus unik" });
    }
    const emails = fields.filter((f) => f.type === "email");
    if (emails.length !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Harus ada tepat satu field bertipe email",
      });
    } else if (!emails[0].required) {
      ctx.addIssue({
        code: "custom",
        message: "Field email wajib dicentang required",
      });
    }
    for (const f of fields) {
      if (f.minLength != null && f.type !== "text" && f.type !== "textarea") {
        ctx.addIssue({
          code: "custom",
          message: `minLength hanya untuk text/textarea (${f.id})`,
        });
        break;
      }
    }
  });

export const DEFAULT_LEAD_FORM_FIELDS_JSON = JSON.stringify([
  {
    id: "fullName",
    label: "Nama lengkap",
    type: "text",
    required: true,
    placeholder: "Nama lengkap",
  },
  {
    id: "brandName",
    label: "Nama brand (opsional)",
    type: "text",
    required: false,
    placeholder: "Nama brand",
  },
  {
    id: "email",
    label: "Email aktif",
    type: "email",
    required: true,
    placeholder: "Email aktif",
  },
  {
    id: "phone",
    label: "Nomor WhatsApp",
    type: "tel",
    required: false,
    placeholder: "Nomor WhatsApp",
  },
  {
    id: "message",
    label: "Ide / pesan",
    type: "textarea",
    required: true,
    placeholder: "Ide singkat",
    minLength: 8,
  },
] satisfies LeadFormField[]);

export function parseLeadFormFieldsJson(raw: string | null | undefined): LeadFormField[] {
  const s = raw?.trim();
  if (!s) {
    return JSON.parse(DEFAULT_LEAD_FORM_FIELDS_JSON) as LeadFormField[];
  }
  const data = JSON.parse(s) as unknown;
  return leadFormFieldsArraySchema.parse(data);
}

export function safeParseLeadFormFieldsJson(
  raw: string | null | undefined,
):
  | { success: true; data: LeadFormField[] }
  | { success: false; error: z.ZodError } {
  const s = raw?.trim();
  if (!s) {
    return { success: true, data: JSON.parse(DEFAULT_LEAD_FORM_FIELDS_JSON) as LeadFormField[] };
  }
  try {
    const data = JSON.parse(s) as unknown;
    const parsed = leadFormFieldsArraySchema.safeParse(data);
    if (parsed.success) {
      return { success: true, data: parsed.data };
    }
    return { success: false, error: parsed.error };
  } catch {
    return {
      success: false,
      error: new z.ZodError([{ code: "custom", message: "JSON tidak valid", path: [] }]),
    };
  }
}

export function leadFormFieldsJsonIssuesSummary(raw: string | null | undefined): string {
  const candidate = raw?.trim() || DEFAULT_LEAD_FORM_FIELDS_JSON;
  const r = safeParseLeadFormFieldsJson(candidate);
  if (r.success) return "";
  return r.error.issues.map((i) => i.message).join(" · ");
}

function fieldValueSchema(f: LeadFormField): z.ZodType<string> {
  const max = f.maxLength ?? 8000;
  if (f.type === "email") {
    if (f.required) {
      return z.string().trim().min(1).max(max).email();
    }
    return z
      .string()
      .max(max)
      .refine((v) => v.trim() === "" || z.string().email().safeParse(v.trim()).success, {
        message: "Format email tidak valid",
      })
      .transform((v) => v.trim());
  }
  let s = z.string().max(max);
  if (f.required) {
    s = z.string().trim().min(1).max(max);
    if ((f.type === "text" || f.type === "textarea") && f.minLength) {
      s = s.min(f.minLength, `Minimal ${f.minLength} karakter`);
    }
    return s;
  }
  if ((f.type === "text" || f.type === "textarea") && f.minLength) {
    return z
      .string()
      .max(max)
      .refine(
        (v) => {
          const t = v.trim();
          return t === "" || t.length >= f.minLength!;
        },
        { message: `Minimal ${f.minLength} karakter jika diisi` },
      )
      .transform((v) => v.trim());
  }
  return z.string().max(max).transform((v) => v.trim());
}

export function buildLeadSubmissionSchema(fields: LeadFormField[]) {
  const shape: Record<string, z.ZodType<string>> = {};
  for (const f of fields) {
    shape[f.id] = fieldValueSchema(f);
  }
  return z.object(shape).strict();
}

/** Isi kolom legacy Lead + JSON untuk tampilan admin / arsip. */
export function deriveLegacyLeadColumns(
  fields: LeadFormField[],
  data: Record<string, string>,
): {
  fullName: string;
  brandName: string | null;
  email: string;
  phone: string | null;
  message: string;
} {
  const val = (id: string) => (data[id] ?? "").trim();

  const emailField = fields.find((f) => f.type === "email");
  const email = emailField ? val(emailField.id) : "";

  let fullName = val("fullName");
  if (!fullName) {
    const firstText = fields.find((f) => f.type === "text");
    fullName = firstText ? val(firstText.id) : "";
  }
  if (!fullName) {
    fullName = email.includes("@") ? email.split("@")[0]! : "Lead";
  }

  const hasBrand = fields.some((f) => f.id === "brandName");
  const brandName = hasBrand ? val("brandName") || null : null;

  const phoneField = fields.find((f) => f.id === "phone" || f.type === "tel");
  const phone = phoneField ? val(phoneField.id) || null : null;

  let message = val("message");
  if (!message) {
    const ta = fields.find((f) => f.type === "textarea");
    message = ta ? val(ta.id) : "";
  }
  if (!message) {
    message = fields.map((f) => `${f.label}: ${val(f.id)}`).filter((l) => !l.endsWith(": ")).join("\n");
  }

  return { fullName, brandName, email, phone, message };
}

export function getLeadCellValue(
  lead: { responsesJson: string | null; fullName: string; email: string; brandName: string | null; phone: string | null; message: string },
  fieldId: string,
): string {
  if (lead.responsesJson) {
    try {
      const obj = JSON.parse(lead.responsesJson) as Record<string, unknown>;
      const v = obj[fieldId];
      if (typeof v === "string" && v.trim()) return v.trim();
    } catch {
      /* fall through */
    }
  }
  const legacy: Record<string, string> = {
    fullName: lead.fullName,
    brandName: lead.brandName ?? "",
    email: lead.email,
    phone: lead.phone ?? "",
    message: lead.message,
  };
  return legacy[fieldId]?.trim() || "—";
}
