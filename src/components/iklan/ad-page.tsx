import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { AdLeadForm, WaLink } from "@/components/iklan/ad-client";
import { getBrandLook } from "@/lib/data";
import {
  IKLAN_FOTO,
  IKLAN_LOGO_URL,
  IKLAN_MAPS_URL,
  IKLAN_WA_DISPLAY,
  type KodeHalaman,
} from "@/lib/iklan";

/* eslint-disable @next/next/no-img-element -- foto & logo langsung dari storage (URL bebas), sama seperti halaman utama */

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
  /** Slip harga di atas foto hero. */
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
  /** Panel isi khusus halaman, di antara hero dan panel pabrik. */
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

const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;

/**
 * Warna brand & logo dari pengaturan admin, supaya halaman iklan ikut berubah bersama
 * halaman utama. Kalau DB tidak terjangkau: warna bawaan globals.css + logo bawaan.
 */
async function brandLook(): Promise<{ style: CSSProperties; logoUrl: string }> {
  const s = await getBrandLook().catch(() => null);
  const vars: Record<string, string> = {};
  if (s && HEX_COLOR.test(s.primaryColor)) vars["--brand-primary"] = s.primaryColor;
  if (s && HEX_COLOR.test(s.secondaryColor)) vars["--brand-secondary"] = s.secondaryColor;
  if (s && HEX_COLOR.test(s.accentColor)) vars["--brand-accent"] = s.accentColor;
  return { style: vars as CSSProperties, logoUrl: s?.siteLogoUrl?.trim() || IKLAN_LOGO_URL };
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}

/* ─── Blok penyusun isi halaman (dipakai file page.tsx tiap halaman) ─── */

/** Satu panel halaman — sama dengan panel section di halaman utama. */
export function AdSection({
  title,
  lead,
  id,
  children,
}: {
  /** Judul panel (opsional: panel dua kolom memakai judul per kolom). */
  title?: string;
  lead?: ReactNode;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="retro-card mx-auto w-full max-w-6xl scroll-mt-6">
      {title ? (
        <header className="mb-8 space-y-3 border-b-2 border-dashed border-black/15 pb-6 md:mb-10 md:pb-8">
          <h2 className="section-title title-pop">{title}</h2>
          {lead ? <p className="section-description max-w-2xl">{lead}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** Dua kolom di desktop, bertumpuk di HP. */
export function AdCols({ children }: { children: ReactNode }) {
  return <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">{children}</div>;
}

/** Satu kolom isi dengan judulnya sendiri. */
export function AdBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="ad-title mb-4">{title}</h2>
      {children}
    </div>
  );
}

export function AdSubTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 mt-9 text-lg font-black tracking-tight text-[var(--retro-black)]">{children}</h3>;
}

/** Daftar centang (teal) atau silang (`no`). */
export function Ticks({ items, no }: { items: ReactNode[]; no?: boolean }) {
  return (
    <ul className="ad-ticks">
      {items.map((item, i) => (
        <li key={i}>
          <span className={no ? "ad-tick ad-tick--no" : "ad-tick"} aria-hidden="true">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              {no ? <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /> : <path d="M2 6.5l2.8 2.8L10 3.5" />}
            </svg>
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Catatan bukti / keterangan — tiket bergaris putus seperti "Why us" di halaman utama. */
export function Proof({ children }: { children: ReactNode }) {
  return (
    <div className="retro-ticket mt-6 block text-sm font-semibold leading-relaxed text-black/90 md:text-[15px]">
      {children}
    </div>
  );
}

/** Tabel contoh harga. */
export function PriceTable({ rows, note }: { rows: readonly (readonly [string, string])[]; note: ReactNode }) {
  return (
    <>
      <div className="retro-item playful-tint-cyan !p-0">
        <table className="w-full text-[15px] md:text-base">
          <tbody>
            {rows.map(([produk, harga]) => (
              <tr key={produk} className="border-b border-dashed border-black/20 last:border-b-0">
                <td className="px-4 py-3.5 font-semibold text-black/90">{produk}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right text-lg font-black">{harga}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm font-medium leading-relaxed text-black/65">{note}</p>
    </>
  );
}

/** Panel "Apa saja yang masuk di harga" — sama di kedua halaman white label. */
export function TermasukHarga() {
  return (
    <AdSection title="Apa saja yang masuk di harga">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="retro-item playful-tint-cyan">
          <h3 className="mb-1 text-lg font-black tracking-tight">Sudah termasuk</h3>
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
        <div className="retro-item playful-tint-orange">
          <h3 className="mb-1 text-lg font-black tracking-tight">Belum termasuk</h3>
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
    </AdSection>
  );
}

/**
 * Kerangka halaman iklan Google, dengan bahasa visual halaman utama: garis tiga warna,
 * panel berbingkai hitam, tombol retro. Header, hero, pabrik, alur order, FAQ, formulir,
 * footer, dan bar HP sama di semua halaman; isi khususnya lewat props & `children`.
 */
export async function AdPage({ kode, layanan, hero, slip, alur, faq, jumlahOptions, children }: AdPageProps) {
  const wa = { kode, layanan };
  const langkah = [...ALUR[alur], ...ALUR_AKHIR];
  const brand = await brandLook();

  return (
    <div className="retro-shell ad-shell" style={brand.style}>
      <a className="skip-to-main" href="#main-content">
        Langsung ke isi
      </a>

      <div className="min-h-screen px-4 pb-28 pt-6 md:px-6 lg:pb-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:gap-10">
          <div className="retro-top-stripes" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <header className="retro-header-panel flex items-center justify-between gap-4 !py-4">
            <Link href="/" prefetch={false} className="retro-focus relative z-10 rounded-lg">
              <img
                src={brand.logoUrl}
                alt="Ellavera Beauty"
                className="h-10 w-auto max-w-[180px] object-contain object-left md:h-12 md:max-w-[260px]"
                width={140}
                height={34}
              />
            </Link>
            <WaLink {...wa} posisi="header" className="ad-wa-pill">
              <WaIcon />
              Chat WhatsApp
            </WaLink>
          </header>

          <main id="main-content" className="ad-stack flex flex-col gap-8 md:gap-10">
            <section className="retro-card mx-auto w-full max-w-6xl">
              <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
                <div className="space-y-5">
                  <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-balance text-[var(--retro-black)] md:text-5xl lg:text-[3.35rem]">
                    {hero.title}
                  </h1>
                  <p className="max-w-lg text-base font-medium leading-relaxed text-black/85 md:text-lg">
                    {hero.sub}
                  </p>
                  <div className="pt-1">
                    <WaLink {...wa} posisi="hero" className="ad-wa-button">
                      <WaIcon />
                      Konsultasi gratis lewat WhatsApp
                    </WaLink>
                  </div>
                  <ul className="flex flex-wrap gap-2 pt-2">
                    <li className="ad-pill">Pabrik sendiri di Gunung Sindur, Bogor</li>
                    <li className="ad-pill">CPKB Grade A</li>
                    <li className="ad-pill">Boleh kunjungi pabrik</li>
                  </ul>
                </div>

                <div className="relative pb-2 lg:pb-12 lg:pl-10">
                  <div className="hero-photo-frame aspect-[16/10] w-full lg:aspect-[4/5] lg:rotate-[1.25deg]">
                    <img
                      src={hero.photo.src}
                      alt={hero.photo.alt}
                      className="h-full w-full object-cover"
                      width={900}
                      height={1125}
                    />
                  </div>
                  <div className="ad-slip relative z-10 mx-auto -mt-10 w-[min(100%,22rem)] -rotate-1 lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:w-[22.5rem] lg:-rotate-2">
                    <h2 className="ad-slip-head">{slip.title}</h2>
                    <div className="px-4 pb-4 pt-3">
                      <dl>
                        {slip.rows.map((row) => (
                          <div className="ad-slip-row" key={row.label}>
                            <dt>{row.label}</dt>
                            <dd>{row.value}</dd>
                          </div>
                        ))}
                        <div
                          className={
                            slip.total.text
                              ? "ad-slip-row ad-slip-total ad-slip-total--text"
                              : "ad-slip-row ad-slip-total"
                          }
                        >
                          <dt>{slip.total.label}</dt>
                          <dd>{slip.total.value}</dd>
                        </div>
                      </dl>
                      <p className="mt-2.5 text-xs font-medium leading-snug text-black/55">{slip.note}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {children}

            <AdSection
              title="Pabrik kami boleh Anda kunjungi"
              lead={
                <>
                  Produksi berjalan di pabrik kami sendiri di Gunung Sindur, Bogor. Kalau mau melihat langsung
                  sebelum order, kabari kami lewat WhatsApp untuk atur jadwal.{" "}
                  <a href={IKLAN_MAPS_URL} target="_blank" rel="noopener">
                    Lihat lokasi di Google Maps
                  </a>
                  .
                </>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {GALERI.map((foto) => (
                  <figure key={foto.label} className="retro-polaroid sm:first:col-span-2 lg:first:col-span-1">
                    <div className="aspect-[4/3] w-full border-b-2 border-[var(--retro-black)]">
                      <img
                        src={foto.src}
                        alt={foto.label}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        width={800}
                        height={600}
                      />
                    </div>
                    <figcaption className="retro-polaroid-caption text-black/80">{foto.label}</figcaption>
                  </figure>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <span className="ad-pill">CPKB Grade A</span>
                <span className="ad-pill">NIB / IUI</span>
                <span className="ad-pill">Pendampingan BPOM dan merek (HAKI)</span>
              </div>
            </AdSection>

            <AdSection title="Alur order">
              <ol className="space-y-6">
                {langkah.map(([judul, isi], index) => (
                  <li key={judul} className="flex gap-4">
                    <div className="flex w-12 shrink-0 flex-col items-center self-stretch md:w-14">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-black bg-[var(--brand-primary)] text-sm font-black shadow-[4px_4px_0_0_rgba(0,0,0,0.9)] md:h-12 md:w-12 md:text-base"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      {index < langkah.length - 1 ? (
                        <span
                          className="mt-3 min-h-[1.5rem] w-1 flex-1 rounded-full bg-gradient-to-b from-[var(--brand-primary)] via-[var(--brand-accent)] to-black/20"
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                    <div className="retro-item min-w-0 flex-1">
                      <strong className="block text-base font-black leading-snug md:text-lg">{judul}</strong>
                      <span className="mt-1 block text-sm font-medium leading-relaxed text-black/75 md:text-[15px]">
                        {isi}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </AdSection>

            <AdSection title="Yang sering ditanyakan">
              <div className="space-y-3">
                {faq.map((item) => (
                  <details
                    key={item.q}
                    className="retro-item group border-[var(--retro-black)]/18 open:border-[var(--brand-primary)] open:bg-white/95 open:ring-2 open:ring-[var(--brand-primary)]/35"
                  >
                    <summary className="cursor-pointer list-none text-base font-black leading-snug">
                      <span
                        className="mr-2 inline-block text-[var(--brand-accent)] transition-transform duration-200 group-open:rotate-90"
                        aria-hidden="true"
                      >
                        ▸
                      </span>
                      {item.q}
                    </summary>
                    <p className="mt-3 border-l-4 border-[var(--brand-primary)] pl-4 text-sm font-medium leading-relaxed text-black/85 md:text-[15px]">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </AdSection>

            <section id="form" className="retro-card mx-auto w-full max-w-6xl scroll-mt-6">
              <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
                <div className="space-y-4">
                  <h2 className="section-title title-pop">Ceritakan rencana brand Anda</h2>
                  <p className="section-description max-w-md">
                    Isi singkat di sini, lalu pesan Anda terkirim lewat WhatsApp ke tim kami. Konsultasi gratis.
                  </p>
                  <p className="text-base font-medium text-black/75">
                    Lebih suka langsung chat?{" "}
                    <WaLink
                      {...wa}
                      posisi="form-samping"
                      className="font-bold underline decoration-[#25D366] decoration-[3px] underline-offset-4 hover:decoration-[var(--retro-black)]"
                    >
                      Buka WhatsApp
                    </WaLink>
                    .
                  </p>
                </div>
                <div className="retro-lead-panel">
                  <AdLeadForm {...wa} jumlahOptions={jumlahOptions}>
                    <WaIcon />
                    Kirim lewat WhatsApp
                  </AdLeadForm>
                </div>
              </div>
            </section>
          </main>

          <footer className="retro-footer-panel flex flex-col gap-4 text-sm text-black/85 sm:flex-row sm:items-end sm:justify-between">
            <p className="leading-relaxed">
              <strong className="text-base font-black text-[var(--retro-black)]">Ellavera Beauty</strong>
              <br />
              PT Mandiri Inovasi Bersama (Divisi Kosmetik)
              <br />
              Gunung Sindur, Bogor
            </p>
            <p className="leading-relaxed sm:text-right">
              WhatsApp:{" "}
              <WaLink
                {...wa}
                posisi="footer"
                className="font-bold underline decoration-[#25D366] decoration-[3px] underline-offset-4 hover:decoration-[var(--retro-black)]"
              >
                {IKLAN_WA_DISPLAY}
              </WaLink>
              <br />
              <Link href="/" prefetch={false}>
                ellavera.id
              </Link>
            </p>
          </footer>
        </div>
      </div>

      <div className="ad-bar">
        <WaLink {...wa} posisi="bar-hp" className="ad-wa-button w-full">
          <WaIcon />
          Chat WhatsApp
        </WaLink>
      </div>
    </div>
  );
}
