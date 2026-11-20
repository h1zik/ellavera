import localFont from "next/font/local";
import "../globals.css";
import { GoogleTag } from "@/components/google-tag";

/**
 * Root layout halaman iklan Google (/maklon-parfum, /parfum-white-label,
 * /skincare-white-label, /maklon-skincare). Tampilannya memakai globals.css & font
 * yang sama dengan halaman utama, tapi layout-nya sengaja terpisah: di sini hanya
 * Google tag yang dimuat (tanpa pixel lain, tanpa tag dari admin) — permintaan tim
 * iklan: satu halaman, satu Google tag. Halaman ini tidak masuk menu.
 */

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

export default function IklanLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <GoogleTag />
      </head>
      <body className={`${geistSans.variable} overflow-x-hidden antialiased`}>{children}</body>
    </html>
  );
}
