import Link from "next/link";
import { AdPage, Ticks } from "@/components/iklan/ad-page";
import { IKLAN_FOTO, adMetadata } from "@/lib/iklan";

export const metadata = adMetadata({
  slug: "maklon-parfum",
  title: "Maklon Parfum Aroma Sendiri | Ellavera Beauty, Bogor",
  description:
    "Bikin parfum dengan aroma sendiri, boleh bawa aroma acuan. Minimal 1.000 pcs per aroma, BPOM didampingi atas nama brand Anda. Pabrik di Gunung Sindur, Bogor.",
  image: IKLAN_FOTO.pengisian,
});

export default function MaklonParfumPage() {
  return (
    <AdPage
      kode="G-MP"
      layanan="maklon parfum"
      hero={{
        title: "Parfum dengan aroma Anda sendiri, dibuat di pabrik kami di Bogor",
        sub: "Ceritakan aroma yang Anda mau, atau bawa parfum acuan. Kami racik sampai cocok, lalu produksi atas nama brand Anda.",
        photo: { src: IKLAN_FOTO.pengisian, alt: "Proses pengisian di pabrik Ellavera Beauty" },
      }}
      slip={{
        title: "Maklon parfum",
        rows: [
          { label: "Aroma", value: "Diracik sesuai keinginan, boleh bawa acuan" },
          { label: "Minimal order", value: "1.000 pcs per aroma" },
          { label: "BPOM", value: "Didampingi, atas nama brand Anda" },
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
              Untuk aroma custom, minimal 1.000 pcs per aroma. Kalau mau mulai lebih kecil, pilih{" "}
              <Link href="/parfum-white-label">parfum white label</Link> dengan 24 aroma siap pakai, mulai 200
              botol.
            </>
          ),
        },
        {
          q: "Berapa harganya?",
          a: "Tergantung aroma, konsentrasi, dan botol yang dipilih. Harga dikirim lewat quotation setelah sampel disetujui, belum termasuk PPN.",
        },
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
      <section>
        <div className="wrap two">
          <div>
            <h2>Yang kami kerjakan untuk Anda</h2>
            <Ticks
              items={[
                "Meracik aroma dari cerita atau parfum acuan yang Anda bawa",
                "Membantu memilih botol dan kemasan",
                "Mendampingi pendaftaran BPOM dan merek (HAKI) atas nama brand Anda",
                "Produksi dan pengecekan mutu di pabrik kami sendiri",
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
                "Pebisnis parfum yang mau aroma khas yang tidak dimiliki brand lain",
                "Pemilik brand yang sudah jalan dan mau pindah atau tambah pabrik",
                "Klinik, salon, MUA, atau influencer yang mau parfum atas nama sendiri",
              ]}
            />
            <h3 style={{ marginTop: 36 }}>Kurang cocok kalau Anda</h3>
            <Ticks
              no
              items={[
                "Beli parfum satuan untuk dipakai sendiri",
                "Mencari bibit parfum atau refill",
                <>
                  Order di bawah 1.000 pcs. Untuk itu ada{" "}
                  <Link href="/parfum-white-label">parfum white label mulai 200 botol</Link>.
                </>,
              ]}
            />
          </div>
        </div>
      </section>
    </AdPage>
  );
}
