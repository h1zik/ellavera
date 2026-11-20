"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  IKLAN_EVENT,
  IKLAN_KONVERSI,
  waHref,
  waHrefWithText,
  type KodeHalaman,
  type PosisiTombol,
} from "@/lib/iklan";

/** Batas tunggu konfirmasi konversi sebelum formulir tetap membuka WhatsApp. */
const TUNGGU_KONVERSI_MS = 1000;

/**
 * Klik tombol WhatsApp: event `lead_whatsapp` + konversi Google Ads "Klik WhatsApp".
 * `transport_type: "beacon"` supaya tetap terkirim walau halaman langsung pindah ke WhatsApp.
 * Nama event, parameter, dan kode konversi mengikuti file tim iklan.
 */
function catat(kode: KodeHalaman, posisi: Exclude<PosisiTombol, "formulir">): void {
  try {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", IKLAN_EVENT, {
      kode_halaman: kode,
      posisi_tombol: posisi,
      transport_type: "beacon",
    });
    window.gtag("event", "conversion", { send_to: IKLAN_KONVERSI, transport_type: "beacon" });
  } catch {
    /* tracking tidak boleh memutus klik */
  }
}

/**
 * Kiriman formulir: konversi dikirim dulu, WhatsApp dibuka lewat `event_callback`
 * (atau setelah TUNGGU_KONVERSI_MS kalau Google tag lambat/diblokir). `buka` dipanggil tepat sekali.
 */
function catatFormulirLaluBuka(kode: KodeHalaman, tujuan: string): void {
  let pergi = false;
  const buka = () => {
    if (pergi) return;
    pergi = true;
    window.location.href = tujuan;
  };
  if (typeof window.gtag !== "function") {
    buka();
    return;
  }
  try {
    window.gtag("event", IKLAN_EVENT, { kode_halaman: kode, posisi_tombol: "formulir" });
    window.gtag("event", "conversion", { send_to: IKLAN_KONVERSI, event_callback: buka });
  } catch {
    /* tetap buka WhatsApp di bawah */
  }
  window.setTimeout(buka, TUNGGU_KONVERSI_MS);
}

type WaLinkProps = {
  kode: KodeHalaman;
  layanan: string;
  posisi: Exclude<PosisiTombol, "formulir">;
  className?: string;
  children: ReactNode;
};

/** Tombol/tautan WhatsApp dengan pesan otomatis berisi kode halaman. */
export function WaLink({ kode, layanan, posisi, className, children }: WaLinkProps) {
  return (
    <a
      className={className}
      data-posisi={posisi}
      href={waHref(layanan, kode)}
      onClick={() => catat(kode, posisi)}
    >
      {children}
    </a>
  );
}

type AdLeadFormProps = {
  kode: KodeHalaman;
  layanan: string;
  jumlahOptions: readonly string[];
  children: ReactNode;
};

/**
 * Formulir tanpa server: isi formulir dibuka sebagai pesan WhatsApp ke nomor lead Google.
 * `children` = isi tombol kirim (ikon + teks).
 */
export function AdLeadForm({ kode, layanan, jumlahOptions, children }: AdLeadFormProps) {
  const [error, setError] = useState("");

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const d = new FormData(ev.currentTarget);
    const text = (name: string) => String(d.get(name) ?? "").trim();
    const nama = text("nama");
    const kota = text("kota");
    const brand = text("brand");
    const jumlah = text("jumlah");
    if (!nama || !kota || !brand || !jumlah) {
      setError("Lengkapi nama, kota, status brand, dan rencana jumlah order.");
      return;
    }
    setError("");
    const msg =
      `Halo Ellavera, saya mau tanya ${layanan}.\n` +
      `Nama: ${nama}\nKota: ${kota}\nBrand: ${brand}\nRencana jumlah: ${jumlah}\n(kode: ${kode})`;
    catatFormulirLaluBuka(kode, waHrefWithText(msg));
  }

  return (
    <form id="leadForm" noValidate onSubmit={onSubmit} className="grid gap-4">
      <label className="block">
        <span className="retro-field-label">Nama</span>
        <input name="nama" autoComplete="name" required className="retro-input" />
      </label>
      <label className="block">
        <span className="retro-field-label">Kota</span>
        <input name="kota" autoComplete="address-level2" required className="retro-input" />
      </label>
      <fieldset>
        <legend className="retro-field-label">Sudah punya brand?</legend>
        <div className="flex flex-wrap gap-2.5">
          <label className="ad-choice">
            <input type="radio" name="brand" value="Sudah jalan" required />
            Sudah jalan
          </label>
          <label className="ad-choice">
            <input type="radio" name="brand" value="Baru mau mulai" />
            Baru mau mulai
          </label>
        </div>
      </fieldset>
      <label className="block">
        <span className="retro-field-label">Rencana jumlah order</span>
        <select name="jumlah" required defaultValue="" className="retro-input">
          <option value="">Pilih</option>
          {jumlahOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
      <p
        id="err"
        role="alert"
        className={
          error ? "rounded-xl border-2 border-red-700/40 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800" : "hidden"
        }
      >
        {error}
      </p>
      <button className="ad-wa-button mt-1 w-full" type="submit">
        {children}
      </button>
    </form>
  );
}
