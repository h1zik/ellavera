import { Onest } from "next/font/google";
import "./iklan.css";
import { GoogleTag } from "@/components/google-tag";

/**
 * Root layout halaman iklan Google (/maklon-parfum, /parfum-white-label,
 * /skincare-white-label, /maklon-skincare). Sengaja terpisah dari layout situs:
 * desainnya beda dan tidak memuat globals.css. Halaman ini tidak masuk menu.
 *
 * Hanya Google tag yang dimuat di sini (tanpa pixel lain, tanpa tag dari admin) —
 * permintaan tim iklan: satu halaman, satu Google tag.
 */

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-onest",
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
      <body className={onest.variable}>{children}</body>
    </html>
  );
}
