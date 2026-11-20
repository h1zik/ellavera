import Link from "next/link";
import { AdPage, TermasukHarga, Ticks } from "@/components/iklan/ad-page";
import { IKLAN_FOTO, IKLAN_PRICELIST_URL, adMetadata } from "@/lib/iklan";

export const metadata = adMetadata({
  slug: "skincare-white-label",
  title: "Skincare White Label Mulai 200 pcs, Free BPOM | Ellavera Beauty",
  description:
    "Brand skincare sendiri dari 81 produk siap pakai. Mulai Rp29.750/pcs untuk 200 pcs, belum PPN. Free BPOM atas nama brand Anda. Pabrik di Bogor.",
  image: IKLAN_FOTO.pabrik,
});

const HALAL = "Sertifikasi halal untuk skincare sedang berjalan, didampingi penyelia halal kami.";

const CONTOH_HARGA = [
  ["Serum Niacinamide 20 mL", "Rp39.100"],
  ["Sunscreen Daily UV Aqua 30 g", "Rp49.550"],
  ["Shampoo Daily Fresh 200 mL", "Rp51.200"],
] as const;

export default function SkincareWhiteLabelPage() {
  return (
    <AdPage
      kode="G-WS"
      layanan="skincare white label"
      hero={{
        title: "Brand skincare sendiri, mulai 200 pcs per produk",
        sub: "Pilih dari 81 produk skincare dan body care siap pakai, tinggal pasang merek. BPOM didaftarkan atas nama brand Anda, dan biayanya sudah masuk harga.",
        photo: { src: IKLAN_FOTO.pabrik, alt: "Pabrik Ellavera Beauty" },
      }}
      slip={{
        title: "Skincare & body care white label",
        rows: [
          { label: "Harga mulai", value: "Rp29.750 per pcs" },
          { label: "Jumlah", value: "200 pcs per produk" },
          { label: "BPOM", value: "Free, atas nama brand Anda" },
        ],
        total: { label: "Modal mulai per produk", value: "Rp5.950.000" },
        note: "200 pcs × Rp29.750, belum termasuk PPN. Harga akhir mengikuti quotation.",
      }}
      alur="white-label"
      faq={[
        {
          q: "Boleh campur beberapa produk dalam 200 pcs?",
          a: "Tidak. Minimal order berlaku per produk. Kalau mau 2 produk, berarti masing-masing memenuhi minimal ordernya.",
        },
        {
          q: "Apa yang sudah termasuk di harga?",
          a: "Formula standar, botol dan tutup standar, stiker label dan segel, pengisian, produksi, pengecekan mutu, dan pendaftaran BPOM.",
        },
        {
          q: "Mau formula sendiri, bukan dari 81 pilihan?",
          a: (
            <>
              Itu lewat <Link href="/maklon-skincare">maklon skincare</Link>, minimal 1.000 pcs per produk.
            </>
          ),
        },
        { q: "Bagaimana dengan halal?", a: HALAL },
        {
          q: "Boleh datang ke pabrik?",
          a: "Boleh. Pabrik kami di Gunung Sindur, Bogor. Kabari dulu lewat WhatsApp supaya kami siapkan jadwalnya.",
        },
      ]}
      jumlahOptions={["200 sampai 300 pcs", "300 sampai 1.000 pcs", "Lebih dari 1.000 pcs", "Belum tahu"]}
    >
      <section>
        <div className="wrap two">
          <div>
            <h2>Contoh harga untuk 200 pcs</h2>
            <table className="prices">
              <tbody>
                {CONTOH_HARGA.map(([produk, harga]) => (
                  <tr key={produk}>
                    <td>{produk}</td>
                    <td>{harga}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="note">
              Per pcs, belum termasuk PPN. Daftar lengkap 81 produk ada di{" "}
              <a href={IKLAN_PRICELIST_URL} target="_blank" rel="noopener">
                pricelist
              </a>
              .
            </p>
          </div>
          <div>
            <h2>Aturan minimal order</h2>
            <Ticks
              items={[
                "Produk nomor 1 sampai 30: minimal 200 pcs per produk",
                "Produk nomor 31 sampai 80: minimal 300 pcs per produk",
                "Produk nomor 81: minimal 1.000 pcs",
                "Minimal order berlaku per produk, tidak bisa dicampur",
                "Sampel Rp50.000 per produk",
              ]}
            />
            <div className="proof">{HALAL}</div>
          </div>
        </div>
      </section>
      <TermasukHarga />
      <section>
        <div className="wrap two fit">
          <div>
            <h2>Cocok untuk siapa</h2>
            <Ticks
              items={[
                "Pemula yang mau punya brand skincare dengan modal terbatas",
                "Reseller atau penjual online yang mau naik kelas jadi pemilik brand",
                "Klinik, salon, MUA, atau influencer yang mau produk atas nama sendiri",
              ]}
            />
          </div>
          <div>
            <h2>Kurang cocok kalau Anda</h2>
            <Ticks
              no
              items={[
                "Beli skincare satuan untuk dipakai sendiri",
                "Mencari produk jadi untuk dijual tanpa merek sendiri",
              ]}
            />
          </div>
        </div>
      </section>
    </AdPage>
  );
}
