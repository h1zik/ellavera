import nodemailer, { type Transporter } from "nodemailer";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secret-box";

/**
 * Sumber konfigurasi SMTP, berurutan:
 *   1. Panel admin (kolom smtp* di SiteSettings) — dipakai kalau host, user,
 *      dan password sudah terisi semua.
 *   2. Environment server (SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER,
 *      SMTP_PASS, SMTP_FROM).
 */
export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export type SmtpSource = "admin" | "env";

export type SmtpSettingsRow = {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean | null;
  smtpUser: string | null;
  smtpPasswordEnc: string | null;
  smtpFrom: string | null;
};

function safePort(raw: number | string | null | undefined, fallback = 587): number {
  const n = typeof raw === "string" ? Number.parseInt(raw.trim(), 10) : raw;
  return typeof n === "number" && Number.isFinite(n) && n > 0 && n < 65536 ? n : fallback;
}

export function readSmtpConfigFromEnv(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS ?? "";
  if (!host || !user || !pass) {
    return null;
  }
  const port = safePort(process.env.SMTP_PORT);
  const secureRaw = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureRaw ? secureRaw === "true" || secureRaw === "1" : port === 465;
  return {
    host,
    port,
    secure,
    user,
    pass,
    from: process.env.SMTP_FROM?.trim() || user,
  };
}

export function readSmtpConfigFromSettings(row: SmtpSettingsRow | null | undefined): SmtpConfig | null {
  const host = row?.smtpHost?.trim();
  const user = row?.smtpUser?.trim();
  const pass = decryptSecret(row?.smtpPasswordEnc);
  if (!host || !user || !pass) {
    return null;
  }
  const port = safePort(row?.smtpPort);
  return {
    host,
    port,
    secure: row?.smtpSecure ?? port === 465,
    user,
    pass,
    from: row?.smtpFrom?.trim() || user,
  };
}

export async function resolveSmtpConfig(
  row?: SmtpSettingsRow | null,
): Promise<{ config: SmtpConfig; source: SmtpSource } | null> {
  const settingsRow =
    row === undefined
      ? await prisma.siteSettings.findUnique({
          where: { id: "default" },
          select: {
            smtpHost: true,
            smtpPort: true,
            smtpSecure: true,
            smtpUser: true,
            smtpPasswordEnc: true,
            smtpFrom: true,
          },
        })
      : row;

  const fromAdmin = readSmtpConfigFromSettings(settingsRow);
  if (fromAdmin) {
    return { config: fromAdmin, source: "admin" };
  }
  const fromEnv = readSmtpConfigFromEnv();
  return fromEnv ? { config: fromEnv, source: "env" } : null;
}

let cachedTransporter: Transporter | null = null;
let cachedKey = "";

function getTransporter(config: SmtpConfig): Transporter {
  // Reuse koneksi antar-request; buat ulang hanya kalau konfigurasi berubah.
  const key = createHash("sha256")
    .update([config.host, config.port, config.secure, config.user, config.pass].join("|"))
    .digest("hex");
  if (!cachedTransporter || cachedKey !== key) {
    cachedTransporter?.close();
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });
    cachedKey = key;
  }
  return cachedTransporter;
}

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  /** Baris SiteSettings kalau sudah diambil pemanggil (hindari query ulang). */
  settingsRow?: SmtpSettingsRow | null;
};

export type SendMailResult =
  | { ok: true; source: SmtpSource }
  | { ok: false; reason: "not-configured" | "no-recipient" | "send-failed"; detail?: string };

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const resolved = await resolveSmtpConfig(input.settingsRow);
  if (!resolved) {
    return { ok: false, reason: "not-configured" };
  }
  const to = input.to.trim();
  if (!to) {
    return { ok: false, reason: "no-recipient" };
  }

  try {
    await getTransporter(resolved.config).sendMail({
      from: resolved.config.from,
      to,
      replyTo: input.replyTo?.trim() || undefined,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true, source: resolved.source };
  } catch (e) {
    return {
      ok: false,
      reason: "send-failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}
