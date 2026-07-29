import type { SiteSettings } from "@prisma/client";
import { isEncryptionAvailable } from "@/lib/secret-box";

/**
 * Bentuk SiteSettings yang aman dikirim ke browser: password SMTP dibuang,
 * diganti flag "sudah diisi atau belum".
 */
export type AdminSiteSettings = Omit<SiteSettings, "smtpPasswordEnc"> & {
  smtpPasswordSet: boolean;
  smtpPasswordEncrypted: boolean;
};

export function toAdminSiteSettings(settings: SiteSettings): AdminSiteSettings {
  const { smtpPasswordEnc, ...rest } = settings;
  return {
    ...rest,
    smtpPasswordSet: Boolean(smtpPasswordEnc?.trim()),
    smtpPasswordEncrypted: isEncryptionAvailable(),
  };
}
