import Link from "next/link";
import type { ReactNode } from "react";
import { AdLeadForm, WaLink } from "@/components/iklan/ad-client";
import {
  IKLAN_FOTO,
  IKLAN_LOGO_URL,
  IKLAN_MAPS_URL,
  IKLAN_WA_DISPLAY,
  type KodeHalaman,
} from "@/lib/iklan";

/* eslint-disable @next/next/no-img-element -- foto & logo langsung dari storage, sama seperti file contoh tim iklan */

export type SlipRow = { label: string; value: string };

export type AdPageProps = {
  kode: KodeHalaman;
  /** Dipakai di pesan WhatsApp, mis. "maklon parfum". */
  layanan: string;
  hero: {
    title: string;
    sub: string;
    photo: { src: string; alt: string };
  };
  /** Kartu ringkasan di atas foto hero. */
  slip: {
    title: string;
    rows: SlipRow[];
    total: SlipRow & { text?: boolean };
    note: string;
  };
  /** Alur order: "custom" (maklon) atau "white-label". */
  alur: keyof typeof ALUR;
  faq: { q: string; a: ReactNode }[];
  jumlahOptions: readonly string[];
  /** Blok isi khusus halaman, di antara hero dan section pabrik. */
  children: ReactNode;
};

const ALUR = {
  custom: [
    ["Ceritakan produk yang Anda mau", "Lewat WhatsApp atau datang langsung ke pabrik."],
    ["Pembuatan sampel", "Kami buat sampel dari brief Anda sampai cocok."],
  ],
  "white-label": [
    ["Pilih produk dan jumlah", "Sebutkan produk atau aroma dan jumlah yang Anda mau."],
    ["Konfirmasi kemasan dan sampel", "Kami cocokkan kemasan, jadwal, dan kirim sampel."],
  ],
} as const;

/** Dua langkah terakhir sama di semua halaman. */
const ALUR_AKHIR = [
  ["Setujui sampel dan dokumen", "Data merek dan dokumen BPOM disiapkan atas nama brand Anda."],
  ["Kunci quotation dan jadwal produksi", "Harga akhir dan jadwal produksi disepakati, lalu produksi berjalan."],
] as const;

const GALERI = [
  { src: IKLAN_FOTO.produksi, label: "Proses produksi" },
  { src: IKLAN_FOTO.area, label: "Area produksi" },
  { src: IKLAN_FOTO.pengisian, label: "Proses pengisian" },
] as const;

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}

/** Daftar centang (atau strip merah untuk `no`). */
export function Ticks({ items, no }: { items: ReactNode[]; no?: boolean }) {
  return (
    <ul className={no ? "ticks no" : "ticks"}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** Section "Apa saja yang masuk di harga" — sama di kedua halaman white label. */
export function TermasukHarga() {
  return (
    <section className="incl">
      <div className="wrap">
        <h2>Apa saja yang masuk di harga</h2>
        <div className="two">
          <div>
            <h3>Sudah termasuk</h3>
            <Ticks
              items={[
                "Formula standar",
                "Botol dan tutup standar",
                "Stiker label dan segel",
                "Pengisian, produksi, dan pengecekan mutu",
                "Pendaftaran BPOM atas nama brand Anda",
              ]}
            />
          </div>
          <div>
            <h3>Belum termasuk</h3>
            <Ticks
              no
              items={[
                "PPN",
                "Ongkos kirim",
                "Box atau kemasan cetak khusus",
                "Desain dan pendaftaran merek",
                "Uji khusus, misalnya untuk klaim SPF",
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Kerangka halaman iklan Google. Header, hero, pabrik, alur order, FAQ, formulir,
 * footer, dan bar HP sama di semua halaman; isi khususnya lewat props & `children`.
 */
export function AdPage({ kode, layanan, hero, slip, alur, faq, jumlahOptions, children }: AdPageProps) {
  const wa = { kode, layanan };
  const langkah = [...ALUR[alur], ...ALUR_AKHIR];

  return (
    <>
      <header className="top">
        <div className="wrap">
          <Link href="/" prefetch={false}>
            <img src={IKLAN_LOGO_URL} alt="Ellavera Beauty" width={140} height={34} />
          </Link>
          <WaLink {...wa} posisi="header" className="small js-wa">
            Chat WhatsApp
          </WaLink>
        </div>
      </header>

      <main>
        <div className="hero">
          <div className="wrap">
            <div>
              <h1>{hero.title}</h1>
              <p className="sub">{hero.sub}</p>
              <WaLink {...wa} posisi="hero" className="btn js-wa">
                <WaIcon />
                Konsultasi gratis lewat WhatsApp
              </WaLink>
              <ul className="facts">
                <li>Pabrik sendiri di Gunung Sindur, Bogor</li>
                <li>CPKB Grade A</li>
                <li>Boleh kunjungi pabrik</li>
              </ul>
            </div>
            <div className="visual">
              <div className="photo">
                <img src={hero.photo.src} alt={hero.photo.alt} width={900} height={1125} />
              </div>
              <div className="slip">
                <h2>{slip.title}</h2>
                <dl>
                  {slip.rows.map((row) => (
                    <div className="row" key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                  <div className={slip.total.text ? "row total text" : "row total"}>
                    <dt>{slip.total.label}</dt>
                    <dd>{slip.total.value}</dd>
                  </div>
                </dl>
                <p>{slip.note}</p>
              </div>
            </div>
          </div>
        </div>

        {children}

        <section className="factory">
          <div className="wrap">
            <h2>Pabrik kami boleh Anda kunjungi</h2>
            <p className="lead">
              Produksi berjalan di pabrik kami sendiri di Gunung Sindur, Bogor. Kalau mau melihat langsung
              sebelum order, kabari kami lewat WhatsApp untuk atur jadwal.{" "}
              <a href={IKLAN_MAPS_URL} target="_blank" rel="noopener">
                Lihat lokasi di Google Maps
              </a>
              .
            </p>
            <div className="gallery">
              {GALERI.map((foto) => (
                <figure key={foto.label}>
                  <img src={foto.src} alt={foto.label} loading="lazy" width={800} height={600} />
                  <figcaption>{foto.label}</figcaption>
                </figure>
              ))}
            </div>
            <div className="certs">
              <span>CPKB Grade A</span>
              <span>NIB / IUI</span>
              <span>Pendampingan BPOM dan merek (HAKI)</span>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <h2>Alur order</h2>
            <ol className="steps">
              {langkah.map(([judul, isi]) => (
                <li key={judul}>
                  <strong>{judul}</strong>
                  <span>{isi}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="faq" style={{ paddingTop: 0 }}>
          <div className="wrap two">
            <h2>Yang sering ditanyakan</h2>
            <div>
              {faq.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="form" id="form">
          <div className="wrap two">
            <div className="side">
              <h2>Ceritakan rencana brand Anda</h2>
              <p>
                Isi singkat di sini, lalu pesan Anda terkirim lewat WhatsApp ke tim kami. Konsultasi gratis.
              </p>
              <p>
                Lebih suka langsung chat?{" "}
                <WaLink {...wa} posisi="form-samping" className="js-wa">
                  Buka WhatsApp
                </WaLink>
                .
              </p>
            </div>
            <AdLeadForm {...wa} jumlahOptions={jumlahOptions}>
              <WaIcon />
              Kirim lewat WhatsApp
            </AdLeadForm>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <p>
            <strong>Ellavera Beauty</strong>
            <br />
            PT Mandiri Inovasi Bersama (Divisi Kosmetik)
            <br />
            Gunung Sindur, Bogor
          </p>
          <p>
            WhatsApp:{" "}
            <WaLink {...wa} posisi="footer" className="js-wa">
              {IKLAN_WA_DISPLAY}
            </WaLink>
            <br />
            <Link href="/" prefetch={false}>
              ellavera.id
            </Link>
          </p>
        </div>
      </footer>

      <div className="bar">
        <WaLink {...wa} posisi="bar-hp" className="btn js-wa">
          <WaIcon />
          Chat WhatsApp
        </WaLink>
      </div>
    </>
  );
}
