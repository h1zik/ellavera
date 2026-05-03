import type { Metadata } from "next";
import localFont from "next/font/local";
import { unstable_cache } from "next/cache";
import "./globals.css";
import { LANDING_CACHE_TAG } from "@/lib/data";

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

const getSettingsForMetadata = unstable_cache(
  () =>
    prisma.siteSettings.findUnique({
      where: { id: "default" },
    }),
  ["site-settings-metadata-v2"],
  { tags: [LANDING_CACHE_TAG], revalidate: 300 },
);

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsForMetadata();

  const title =
    settings?.seoTitle ??
    "Maklon Kosmetik Ellavera | Bangun Brand Beauty Tanpa Ribet";
  const description =
    settings?.seoDescription ??
    "Ellavera membantu brand owner membangun brand kosmetik secara cepat, legal, dan scalable.";
  const keywords = settings?.seoKeywords;

  const favicon = settings?.faviconUrl?.trim();
  /** Tanpa `as const` — Next `Metadata.icons` mengharuskan `Icon[]` mutable. */
  const icons: Metadata["icons"] = favicon
    ? { icon: [{ url: favicon }] }
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
