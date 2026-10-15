"use client";

import { useId, useState } from "react";

type Props = {
  label?: string;
  currentUrl: string;
  onUrlChange: (url: string) => void;
  compact?: boolean;
  /** Teks bantu di bawah label, mis. ukuran yang disarankan. */
  hint?: string;
  /** Preview lebar penuh — untuk gambar landscape besar. */
  widePreview?: boolean;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ImageUploadField({
  label = "Upload gambar",
  currentUrl,
  onUrlChange,
  compact,
  hint,
  widePreview,
}: Props) {
  const inputId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function upload(file: File) {
    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Format tidak didukung. Pakai JPG, PNG, WebP, atau GIF.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Upload gagal");
      }
      if (data.url) {
        onUrlChange(data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setLoading(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void upload(file);
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {!compact ? (
        <div>
          <p className="text-sm font-bold text-black/80">{label}</p>
          {hint ? <p className="text-xs font-medium text-black/55">{hint}</p> : null}
        </div>
      ) : null}
      <label
        htmlFor={inputId}
        className={["admin-dropzone", dragOver ? "admin-dropzone--over" : ""].join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !loading) void upload(file);
        }}
      >
        <span className="retro-button-alt pointer-events-none inline-flex px-3 py-2 text-xs">
          {loading ? "Mengunggah…" : currentUrl ? "Ganti gambar" : "Pilih gambar"}
        </span>
        <span className="text-xs font-medium text-black/55">atau seret file ke sini</span>
        <input
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={onFile}
          disabled={loading}
        />
      </label>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      {currentUrl ? (
        <div className="space-y-1.5">
          <div
            className={[
              "overflow-hidden rounded-lg border-2 border-black/15",
              widePreview ? "bg-white" : "admin-checker inline-block",
            ].join(" ")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt=""
              className={widePreview ? "block h-auto w-full" : "max-h-32 w-auto object-contain"}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[16rem] truncate text-[11px] font-medium text-black/50 underline"
              title={currentUrl}
            >
              {currentUrl}
            </a>
            <button
              type="button"
              className="text-[11px] font-bold text-red-700 underline"
              onClick={() => onUrlChange("")}
            >
              Hapus gambar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
