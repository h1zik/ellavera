/**
 * Halaman iklan Google (landing page khusus Google Ads).
 * Nomor WhatsApp, kode halaman, dan nama event mengikuti catatan tim iklan —
 * jangan disamakan dengan nomor CS di pengaturan situs.
 */
import type { Metadata } from "next";

/** Nomor khusus lead Google: +62 813-8994-242. Bukan nomor CS Meta. */
export const IKLAN_WA_NUMBER = "628138994242";
export const IKLAN_WA_DISPLAY = "+62 813-8994-242";

/** Kode asal chat yang ikut di setiap pesan WhatsApp. */
export type KodeHalaman = "G-MP" | "G-WP" | "G-WS" | "G-MS";

/** Posisi tombol yang dikirim bersama event `lead_whatsapp`. */
export type PosisiTombol = "header" | "hero" | "form-samping" | "footer" | "bar-hp" | "formulir";

export const IKLAN_EVENT = "lead_whatsapp";

/**
 * Kode konversi Google Ads "Klik WhatsApp" — dikirim di setiap klik tombol WhatsApp
 * dan kiriman formulir. Jangan tempel event snippet-nya di <head>: setiap kunjungan
 * halaman akan terhitung sebagai konversi.
 */
export const IKLAN_KONVERSI = "AW-18566378554/yVSKCM269LsdELrokZVF";

const SITE_URL = "https://ellavera.id";
const STORAGE = "https://api.ellavera.id/storage/v1/object/public/media/site";

export const IKLAN_LOGO_URL =
  "https://api.mibchemicals.com/storage/v1/object/public/uploads/site/da8b4ae3-473b-4755-b7a5-ec9e7c8cf58a.png";

export const IKLAN_FOTO = {
  pengisian: `${STORAGE}/6fe4d235-f5af-4db5-8f18-9102eeb97a45.jpg`,
  pabrik: `${STORAGE}/0fbe42b1-dc2c-4995-86af-137a422d77e0.jpg`,
  produksi: `${STORAGE}/d898c790-fc6e-44ee-97ad-53700ad30ef4.jpg`,
  area: `${STORAGE}/ce7c1805-cd29-4eaa-8f42-22531435dd71.jpg`,
} as const;

export const IKLAN_PRICELIST_URL = "https://bit.ly/Price_List_Ellavera";
export const IKLAN_MAPS_URL = "https://maps.app.goo.gl/GuXZk7kTmZSaMyN29";

/** wa.me dengan pesan bebas ke nomor lead Google. */
export function waHrefWithText(text: string): string {
  // Kurung ikut di-encode supaya URL sama persis dengan file contoh tim iklan.
  const encoded = encodeURIComponent(text).replace(/\(/g, "%28").replace(/\)/g, "%29");
  return `https://wa.me/${IKLAN_WA_NUMBER}?text=${encoded}`;
}

/** Tautan tombol WhatsApp: pesan otomatis + kode halaman. */
export function waHref(layanan: string, kode: KodeHalaman): string {
  return waHrefWithText(`Halo Ellavera, saya mau konsultasi ${layanan}. (kode: ${kode})`);
}

/** Metadata satu halaman iklan: title, description, canonical, Open Graph. */
export function adMetadata(input: {
  slug: string;
  title: string;
  description: string;
  image: string;
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: `${SITE_URL}/${input.slug}` },
    openGraph: {
      title: input.title,
      description: input.description,
      images: [input.image],
    },
  };
}
