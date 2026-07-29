import type { LeadFormField } from "@/lib/lead-form-config";

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "a@x.com, b@y.com" → ["a@x.com", "b@y.com"]. Dipakai untuk field penerima di admin. */
export function parseRecipientList(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function invalidRecipients(raw: string | null | undefined): string[] {
  return parseRecipientList(raw).filter((e) => !EMAIL_RE.test(e));
}

export type LeadEmailInput = {
  fields: LeadFormField[];
  data: Record<string, string>;
  siteName: string;
  submitterName: string;
  submitterEmail: string;
  leadId: string;
};

export function buildLeadEmail({
  fields,
  data,
  siteName,
  submitterName,
  submitterEmail,
  leadId,
}: LeadEmailInput): { subject: string; text: string; html: string } {
  const rows = fields.map((f) => ({
    label: f.label,
    value: (data[f.id] ?? "").trim() || "—",
  }));

  const subject = `Lead baru: ${submitterName || submitterEmail || "tanpa nama"} — ${siteName}`;

  const text = [
    `Lead baru dari form ${siteName}.`,
    "",
    ...rows.map((r) => `${r.label}: ${r.value}`),
    "",
    `ID lead: ${leadId}`,
    "Balas email ini untuk langsung menghubungi pengirim.",
  ].join("\n");

  const rowsHtml = rows
    .map(
      (r) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:700;color:#444;vertical-align:top;white-space:nowrap;">${escapeHtml(
            r.label,
          )}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#111;white-space:pre-wrap;">${escapeHtml(
            r.value,
          )}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:24px;background:#faf8f3;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border:2px solid #111;border-radius:16px;overflow:hidden;">
      <div style="padding:18px 22px;background:#26CCC2;border-bottom:2px solid #111;">
        <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:800;color:rgba(0,0,0,0.6);">Lead baru</p>
        <p style="margin:6px 0 0;font-size:20px;font-weight:800;color:#111;">${escapeHtml(siteName)}</p>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rowsHtml}
      </table>
      <div style="padding:14px 22px;background:#faf8f3;font-size:12px;color:#666;">
        <p style="margin:0;">ID lead: ${escapeHtml(leadId)}</p>
        <p style="margin:6px 0 0;">Balas email ini untuk langsung menghubungi pengirim.</p>
      </div>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}
