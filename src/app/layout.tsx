import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { prisma } from "@/lib/prisma";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
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
  /** Tanpa unstable_cache: favicon/title harus langsung ikut DB setelah simpan di admin (bukan cache 300s). */
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

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
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} overflow-x-hidden antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
