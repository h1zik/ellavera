"use client";

import { useMemo } from "react";
import { TalentCard, parseTalentGalleryDraft } from "@/lib/talent-gallery";
import { ImageUploadField } from "./image-upload-field";

type Props = {
  json: string | null | undefined;
  onChange: (json: string | null) => void;
};

function serialize(items: TalentCard[]): string | null {
  if (items.length === 0) {
    return null;
  }
  return JSON.stringify(items);
}

export function TalentGalleryEditor({ json, onChange }: Props) {
  const items = useMemo(() => parseTalentGalleryDraft(json ?? null), [json]);

  function update(at: number, patch: Partial<TalentCard>) {
    const next = items.map((item, i) => (i === at ? { ...item, ...patch } : item));
    onChange(serialize(next));
  }

  function add() {
    const next = [...items, { imageUrl: "", name: "", role: "" }];
    onChange(serialize(next));
  }

  function remove(at: number) {
    const next = items.filter((_, i) => i !== at);
    onChange(serialize(next));
  }

  return (
    <div className="space-y-3">
      {items.length > 0 ? (
        <ol className="space-y-2">
          {items.map((person, idx) => (
            <li
              key={`talent-${idx}-${person.imageUrl || "x"}`}
              className="set-field flex flex-wrap items-start gap-3 p-3"
            >
              <div className="set-image-thumb admin-checker h-20 w-20">
                {person.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL bebas dari admin
                  <img src={person.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>Foto</span>
                )}
              </div>
              <div className="grid min-w-0 flex-1 basis-60 gap-2 sm:grid-cols-2">
                <input
                  className="retro-input py-2 text-sm"
                  aria-label={`Nama orang ke-${idx + 1}`}
                  placeholder="Nama"
                  value={person.name ?? ""}
                  onChange={(e) => update(idx, { name: e.target.value })}
                />
                <input
                  className="retro-input py-2 text-sm"
                  aria-label={`Peran orang ke-${idx + 1}`}
                  placeholder="Peran, mis. Formulator"
                  value={person.role ?? ""}
                  onChange={(e) => update(idx, { role: e.target.value })}
                />
                <div className="sm:col-span-2">
                  <ImageUploadField
                    compact
                    hidePreview
                    currentUrl={person.imageUrl}
                    onUrlChange={(url) => update(idx, { imageUrl: url })}
                  />
                </div>
              </div>
              <button
                type="button"
                className="admin-icon-btn admin-icon-btn--danger"
                onClick={() => remove(idx)}
                aria-label={`Hapus orang ke-${idx + 1}`}
                title="Hapus"
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="admin-empty">Belum ada foto tim.</p>
      )}
      <button type="button" className="retro-button-alt px-4 py-2 text-xs" onClick={add}>
        Tambah orang
      </button>
    </div>
  );
}
