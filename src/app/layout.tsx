import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClickTracker } from "@/components/click-tracker";
import { TrackingScripts } from "@/components/tracking-scripts";
import { getHeadSettings } from "@/lib/data";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

/** Tebak MIME untuk <link type="…"> — membantu browser/CDN. */
function iconMimeFromUrl(url: string): string | undefined {
  const path = url.toLowerCase().split("?")[0] ?? "";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".ico")) return "image/x-icon";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  return undefined;
}

export async function generateMetadata(): Promise<Metadata> {
  /** Cache ditag "landing" — langsung ter-invalidate saat pengaturan disimpan di admin. */
  const settings = await getHeadSettings();

  const title =
    settings?.seoTitle ??
    "Maklon Kosmetik Ellavera | Bangun Brand Beauty Tanpa Ribet";
  const description =
    settings?.seoDescription ??
    "Ellavera membantu brand owner membangun brand kosmetik secara cepat, legal, dan scalable.";
  const keywords = settings?.seoKeywords;

  const favicon = settings?.faviconUrl?.trim();
  /** Same-origin `/favicon.ico` → rewrite ke `/api/favicon` (isi dari DB). */
  const mime = favicon ? iconMimeFromUrl(favicon) : undefined;
  const sameOriginIcon = favicon
    ? { url: "/favicon.ico", ...(mime ? { type: mime } : { type: "image/png" as const }) }
    : null;

  const icons: Metadata["icons"] | undefined = sameOriginIcon
    ? {
        icon: [sameOriginIcon],
        shortcut: [sameOriginIcon],
        apple: [sameOriginIcon],
      }
    : undefined;

  return {
    title,
    description,
    keywords,
    ...(icons ? { icons } : {}),
    openGraph: {
      title,
      description,
      type: "website",
      locale: "id_ID",
      ...(settings?.siteName ? { siteName: settings.siteName } : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /** Sama dengan generateMetadata — satu entri cache, invalidasi via tag "landing". */
  const settings = await getHeadSettings();

  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} overflow-x-hidden antialiased`}
      >
        <TrackingScripts settings={settings} />
        <ClickTracker />
        {children}
      </body>
    </html>
  );
}
