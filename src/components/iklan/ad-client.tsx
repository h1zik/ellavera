"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  IKLAN_EVENT,
  waHref,
  waHrefWithText,
  type KodeHalaman,
  type PosisiTombol,
} from "@/lib/iklan";

/**
 * Event konversi halaman iklan Google: dikirim ke `dataLayer` (untuk GTM) dan ke
 * `gtag()` bila Google tag terpasang. Nama event & parameter mengikuti catatan tim iklan.
 */
function catat(kode: KodeHalaman, posisi: PosisiTombol): void {
  try {
    const w = window;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: IKLAN_EVENT, kode_halaman: kode, posisi_tombol: posisi });
    if (typeof w.gtag === "function") {
      w.gtag("event", IKLAN_EVENT, { kode_halaman: kode, posisi_tombol: posisi });
    }
  } catch {
    /* tracking tidak boleh memutus klik */
  }
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
    catat(kode, "formulir");
    window.location.href = waHrefWithText(msg);
  }

  return (
    <form id="leadForm" noValidate onSubmit={onSubmit}>
      <label>
        Nama
        <input name="nama" autoComplete="name" required />
      </label>
      <label>
        Kota
        <input name="kota" autoComplete="address-level2" required />
      </label>
      <fieldset>
        <legend>Sudah punya brand?</legend>
        <div className="choice">
          <label>
            <input type="radio" name="brand" value="Sudah jalan" required />
            Sudah jalan
          </label>
          <label>
            <input type="radio" name="brand" value="Baru mau mulai" />
            Baru mau mulai
          </label>
        </div>
      </fieldset>
      <label>
        Rencana jumlah order
        <select name="jumlah" required defaultValue="">
          <option value="">Pilih</option>
          {jumlahOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
      <p className="err" id="err" role="alert">
        {error}
      </p>
      <button className="btn" type="submit">
        {children}
      </button>
    </form>
  );
}
