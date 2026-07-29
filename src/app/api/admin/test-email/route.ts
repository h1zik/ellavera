import { NextResponse } from "next/server";
import { parseRecipientList } from "@/lib/lead-email";
import { resolveSmtpConfig, sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

/** Kirim email percobaan ke alamat penerima yang tersimpan. Route ini di balik session admin (middleware). */
export async function POST() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: {
        siteName: true,
        leadNotifyEmail: true,
        contactEmail: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
        smtpPasswordEnc: true,
        smtpFrom: true,
      },
    });

    const resolved = await resolveSmtpConfig(settings ?? null);
    if (!resolved) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "SMTP belum lengkap. Isi host, username, dan password di blok ini, lalu Simpan dulu sebelum tes.",
        },
        { status: 400 },
      );
    }

    const recipients = parseRecipientList(
      settings?.leadNotifyEmail?.trim() || settings?.contactEmail || "",
    );
    if (recipients.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Belum ada email penerima. Isi kolom penerima notifikasi lalu Simpan." },
        { status: 400 },
      );
    }

    const siteName = settings?.siteName || "Ellavera";
    const sent = await sendMail({
      settingsRow: settings ?? null,
      to: recipients.join(", "),
      subject: `Tes pengiriman email — ${siteName}`,
      text: `Kalau email ini masuk, pengaturan SMTP ${siteName} sudah benar dan notifikasi lead akan terkirim ke alamat ini.`,
      html: `<p style="font-family:sans-serif;font-size:14px;line-height:1.6">Kalau email ini masuk, pengaturan SMTP <strong>${siteName}</strong> sudah benar dan notifikasi lead akan terkirim ke alamat ini.</p>`,
    });

    if (!sent.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: `Gagal kirim: ${sent.detail || sent.reason}`,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Email tes terkirim ke ${recipients.join(", ")} (sumber konfigurasi: ${
        sent.source === "admin" ? "panel admin" : "environment server"
      }). Cek inbox / folder spam.`,
    });
  } catch (e) {
    console.error("[test-email POST]", e);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
