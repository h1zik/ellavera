import { Onest } from "next/font/google";
import "./iklan.css";
import { TrackingScripts } from "@/components/tracking-scripts";
import { getHeadSettings } from "@/lib/data";

/**
 * Root layout halaman iklan Google (/maklon-parfum, /parfum-white-label,
 * /skincare-white-label, /maklon-skincare). Sengaja terpisah dari layout situs:
 * desainnya beda dan tidak memuat globals.css. Halaman ini tidak masuk menu.
 */

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-onest",
  display: "swap",
});

export default async function IklanLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * Google tag / GTM diambil dari Admin → Tracking iklan (cache ditag "landing").
   * Kalau DB sedang bermasalah, halaman iklan tetap tampil tanpa tag.
   */
  const settings = await getHeadSettings().catch(() => null);

  return (
    <html lang="id">
      <body className={onest.variable}>
        <TrackingScripts settings={settings} platforms="google" />
        {children}
      </body>
    </html>
  );
}
