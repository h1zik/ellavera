import type { Metadata } from "next";
import { HomeView } from "@/components/home-view";

/**
 * Halaman tujuan iklan ChatGPT: isi sama dengan halaman utama, tapi tujuannya satu —
 * WhatsApp. Tanpa formulir, satu tombol WhatsApp di section paling bawah.
 * Tidak masuk menu. Pixel (termasuk OpenAI) ikut pengaturan admin lewat layout (site).
 */
export const metadata: Metadata = {
  // Isinya salinan halaman utama — arahkan mesin pencari ke halaman utama.
  alternates: { canonical: "https://ellavera.id/" },
};

export default function MaklonKosmetikPage() {
  return <HomeView waOnly />;
}
