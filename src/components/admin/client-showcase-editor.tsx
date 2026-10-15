"use client";

import { ImageUploadField } from "@/components/admin/image-upload-field";

/** Ukuran kanvas yang disarankan — rasio 12:5, cukup tajam untuk layar lebar & retina. */
export const SHOWCASE_WIDTH = 2400;
export const SHOWCASE_HEIGHT = 1000;

type Props = {
  url: string;
  onChange: (url: string) => void;
  /** Jumlah logo satuan lama — dipakai sebagai cadangan selama gambar besar belum diisi. */
  legacyLogoCount: number;
};

function downloadWhiteTemplate() {
  const canvas = document.createElement("canvas");
  canvas.width = SHOWCASE_WIDTH;
  canvas.height = SHOWCASE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `template-logo-klien-${SHOWCASE_WIDTH}x${SHOWCASE_HEIGHT}.png`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, "image/png");
}

/** Editor khusus section portofolio: satu gambar landscape berisi semua logo klien. */
export function ClientShowcaseEditor({ url, onChange, legacyLogoCount }: Props) {
  return (
    <div className="admin-feature-panel space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl space-y-1">
          <h3 className="text-base font-black text-[var(--retro-black)]">
            Gambar logo klien
          </h3>
          <p className="text-sm text-black/65">
            Tampil sebagai satu gambar besar di atas latar putih. Susun semua logo klien dalam
            satu file landscape, lalu upload di sini.
          </p>
        </div>
        <button
          type="button"
          className="retro-button-alt shrink-0 px-3 py-2 text-xs"
          onClick={downloadWhiteTemplate}
        >
          Unduh template putih
        </button>
      </div>

      <ImageUploadField
        label="File gambar"
        hint={`Disarankan ${SHOWCASE_WIDTH}×${SHOWCASE_HEIGHT} px, latar putih, JPG/PNG/WebP di bawah 1 MB supaya cepat dimuat.`}
        currentUrl={url}
        onUrlChange={onChange}
        widePreview
      />

      {!url ? (
        <div className="admin-showcase-empty">
          <span>
            {legacyLogoCount > 0
              ? `Belum ada gambar — sementara halaman menampilkan ${legacyLogoCount} logo satuan di kanvas putih`
              : "Belum ada gambar — halaman menampilkan kanvas putih kosong"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
