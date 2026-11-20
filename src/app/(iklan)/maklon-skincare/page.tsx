import Link from "next/link";
import { AdBlock, AdCols, AdPage, AdSection, AdSubTitle, Ticks } from "@/components/iklan/ad-page";
import { IKLAN_FOTO, adMetadata } from "@/lib/iklan";

export const metadata = adMetadata({
  slug: "maklon-skincare",
  title: "Maklon Skincare & Body Care, Pabrik CPKB Grade A Bogor | Ellavera Beauty",
  description:
    "Maklon skincare dan body care dengan formula milik brand Anda. Minimal 1.000 pcs per produk. Pabrik CPKB Grade A di Gunung Sindur, Bogor, boleh dikunjungi.",
  image: IKLAN_FOTO.pabrik,
});

const HALAL = "Sertifikasi halal untuk skincare sedang berjalan, didampingi penyelia halal kami.";

export default function MaklonSkincarePage() {
  return (
    <AdPage
      kode="G-MS"
      layanan="maklon skincare"
      hero={{
        title: "Maklon skincare dengan formula milik brand Anda",
        sub: "Formula dibuat dari brief Anda dan diproduksi di pabrik bersertifikat CPKB Grade A di Gunung Sindur, Bogor. Silakan datang melihat pabriknya.",
        photo: { src: IKLAN_FOTO.pabrik, alt: "Pabrik Ellavera Beauty" },
      }}
      slip={{
        title: "Maklon skincare & body care",
        rows: [
          { label: "Formula", value: "Dibuat sesuai keinginan Anda" },
          { label: "Minimal order", value: "1.000 pcs per produk" },
          { label: "BPOM & merek", value: "Didampingi, atas nama brand Anda" },
        ],
        total: { label: "Harga", value: "Lewat quotation setelah sampel disetujui", text: true },
        note: "Semua harga belum termasuk PPN.",
      }}
      alur="custom"
      faq={[
        {
          q: "Bisa order di bawah 1.000 pcs?",
          a: (
            <>
              Untuk formula custom, minimal 1.000 pcs per produk. Kalau mau mulai lebih kecil, pilih{" "}
              <Link href="/skincare-white-label">skincare white label</Link>, mulai 200 pcs.
            </>
          ),
        },
        {
          q: "Berapa harganya?",
          a: "Tergantung formula, bahan, dan kemasan. Harga dikirim lewat quotation setelah sampel disetujui, belum termasuk PPN.",
        },
        { q: "Bagaimana dengan halal?", a: HALAL },
        {
          q: "BPOM-nya atas nama siapa?",
          a: "Atas nama brand Anda. Kami dampingi prosesnya, termasuk pendaftaran merek.",
        },
        {
          q: "Boleh datang ke pabrik?",
          a: "Boleh. Pabrik kami di Gunung Sindur, Bogor. Kabari dulu lewat WhatsApp supaya kami siapkan jadwalnya.",
        },
      ]}
      jumlahOptions={["1.000 pcs", "1.000 sampai 3.000 pcs", "Lebih dari 3.000 pcs", "Belum tahu"]}
    >
      <AdSection>
        <AdCols>
          <AdBlock title="Yang kami kerjakan untuk Anda">
            <Ticks
              items={[
                "Membuat formula dan sampel dari brief Anda",
                "Membantu memilih kemasan",
                "Mendampingi pendaftaran BPOM dan merek (HAKI) atas nama brand Anda",
                "Produksi dan pengecekan mutu di pabrik bersertifikat CPKB Grade A",
                HALAL,
              ]}
            />
          </AdBlock>
          <AdBlock title="Cocok untuk siapa">
            <Ticks
              items={[
                "Pemilik brand yang sudah jalan dan mau ganti atau tambah pabrik",
                "Brand yang butuh formula khusus dengan kualitas stabil",
                "Klinik, salon, MUA, atau influencer yang mau produk atas nama sendiri",
              ]}
            />
            <AdSubTitle>Kurang cocok kalau Anda</AdSubTitle>
            <Ticks
              no
              items={[
                "Beli skincare satuan untuk dipakai sendiri",
                <>
                  Order di bawah 1.000 pcs. Untuk itu ada{" "}
                  <Link href="/skincare-white-label">skincare white label mulai 200 pcs</Link>.
                </>,
              ]}
            />
          </AdBlock>
        </AdCols>
      </AdSection>
    </AdPage>
  );
}
