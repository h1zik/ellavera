import Link from "next/link";
import { AdPage, TermasukHarga, Ticks } from "@/components/iklan/ad-page";
import { IKLAN_FOTO, IKLAN_PRICELIST_URL, adMetadata } from "@/lib/iklan";

export const metadata = adMetadata({
  slug: "parfum-white-label",
  title: "Parfum White Label Mulai 200 Botol, Free BPOM | Ellavera Beauty",
  description:
    "Brand parfum sendiri dari 24 aroma siap pakai. Mulai Rp32.000/botol EDP 30 mL untuk 200 botol, belum PPN. Free BPOM atas nama brand Anda.",
  image: IKLAN_FOTO.pengisian,
});

function Pricelist() {
  return (
    <a href={IKLAN_PRICELIST_URL} target="_blank" rel="noopener">
      pricelist
    </a>
  );
}

export default function ParfumWhiteLabelPage() {
  return (
    <AdPage
      kode="G-WP"
      layanan="parfum white label"
      hero={{
        title: "Punya brand parfum sendiri, mulai 200 botol",
        sub: "Pilih dari 24 aroma siap pakai, pasang merek Anda. BPOM didaftarkan atas nama brand Anda, dan biayanya sudah masuk harga.",
        photo: { src: IKLAN_FOTO.pengisian, alt: "Proses pengisian di pabrik Ellavera Beauty" },
      }}
      slip={{
        title: "Parfum white label, EDP 30 mL",
        rows: [
          { label: "Harga mulai", value: "Rp32.000 per botol" },
          { label: "Jumlah", value: "200 botol per aroma" },
          { label: "BPOM", value: "Free, atas nama brand Anda" },
        ],
        total: { label: "Modal mulai per aroma", value: "Rp6.400.000" },
        note: "200 botol × Rp32.000, belum termasuk PPN. Harga akhir mengikuti quotation.",
      }}
      alur="white-label"
      faq={[
        {
          q: "Boleh campur beberapa aroma dalam 200 botol?",
          a: "Tidak. Minimal 200 botol berlaku per aroma. Kalau mau 2 aroma, berarti 200 botol untuk masing-masing aroma.",
        },
        { q: "Bisa coba aromanya dulu?", a: "Bisa. Sampel Rp50.000 per aroma." },
        {
          q: "Apakah ada harga lebih murah untuk jumlah besar?",
          a: (
            <>
              Ada. Makin banyak jumlahnya, makin murah per botol. Rinciannya ada di <Pricelist />.
            </>
          ),
        },
        {
          q: "Mau aroma sendiri, bukan dari 24 pilihan?",
          a: (
            <>
              Itu lewat <Link href="/maklon-parfum">maklon parfum</Link>, minimal 1.000 pcs per aroma.
            </>
          ),
        },
        {
          q: "Boleh datang ke pabrik?",
          a: "Boleh. Pabrik kami di Gunung Sindur, Bogor. Kabari dulu lewat WhatsApp supaya kami siapkan jadwalnya.",
        },
      ]}
      jumlahOptions={["200 botol", "200 sampai 500 botol", "500 sampai 1.000 botol", "Lebih dari 1.000 botol"]}
    >
      <section>
        <div className="wrap two">
          <div>
            <h2>Pilihan yang tersedia</h2>
            <Ticks
              items={[
                "24 aroma: 8 pria, 8 wanita, 8 uniseks",
                "Konsentrasi EDP dan Extrait",
                <>
                  Ukuran 30 mL dan 50 mL. Harga ukuran dan konsentrasi lain ada di <Pricelist />
                </>,
                "Minimal 200 botol per aroma, tidak bisa dicampur beberapa aroma",
                "Sampel Rp50.000 per aroma",
              ]}
            />
            <div className="proof">
              Contoh hasil pabrik kami: parfum <em>Secret of Buton</em> dari Archipelago Scent, brand parfum
              milik kami sendiri.
            </div>
          </div>
          <div className="fit">
            <h2>Cocok untuk siapa</h2>
            <Ticks
              items={[
                "Pemula yang mau punya brand parfum dengan modal terbatas",
                "Reseller atau penjual online yang mau naik kelas jadi pemilik brand",
                "Klinik, salon, MUA, atau influencer yang mau parfum atas nama sendiri",
              ]}
            />
            <h3 style={{ marginTop: 36 }}>Kurang cocok kalau Anda</h3>
            <Ticks
              no
              items={[
                "Beli parfum satuan untuk dipakai sendiri",
                "Mencari bibit parfum atau refill",
                "Mencari produk jadi untuk dijual tanpa merek sendiri",
              ]}
            />
          </div>
        </div>
      </section>
      <TermasukHarga />
    </AdPage>
  );
}
