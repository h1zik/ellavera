"use client";

import { useState } from "react";

type Props = {
  label?: string;
  currentUrl: string;
  onUrlChange: (url: string) => void;
  compact?: boolean;
};

export function ImageUploadField({
  label = "Upload gambar",
  currentUrl,
  onUrlChange,
  compact,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
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

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {!compact ? (
        <p className="text-xs font-bold uppercase tracking-wide text-black/60">{label}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer">
          <span className="retro-button-alt inline-flex px-3 py-2 text-xs">
            {loading ? "Mengunggah…" : "Pilih file"}
          </span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onFile} disabled={loading} />
        </label>
        {currentUrl ? (
          <span className="max-w-[180px] truncate text-[10px] text-black/45" title={currentUrl}>
            {currentUrl}
          </span>
        ) : null}
      </div>
      {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
      {currentUrl ? (
        <div className="mt-2 overflow-hidden rounded-lg border-2 border-black/15 bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="" className="max-h-28 w-auto object-contain" />
        </div>
      ) : null}
    </div>
  );
}
