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
    <div className="space-y-4 md:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <label className="block text-sm font-bold" htmlFor="talent-help">
            Talent / tim (opsional)
          </label>
          <p id="talent-help" className="text-xs text-black/55">
            Tambah orang satu per satu: foto (upload), nama, dan peran di tim.
          </p>
        </div>
        <button type="button" className="retro-button-alt px-3 py-2 text-xs" onClick={add}>
          + Baris talent
        </button>
      </div>

      <div className="space-y-4">
        {items.map((person, idx) => (
          <div
            key={`talent-${idx}-${person.imageUrl || "x"}`}
            className="rounded-xl border-2 border-black/12 bg-white/90 p-4"
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                className="text-xs font-bold uppercase text-red-600 underline"
                onClick={() => remove(idx)}
              >
                Hapus baris
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ImageUploadField
                compact
                label="Foto"
                currentUrl={person.imageUrl}
                onUrlChange={(url) => update(idx, { imageUrl: url })}
              />
              <div className="space-y-2">
                <input
                  className="retro-input"
                  placeholder="Nama"
                  value={person.name ?? ""}
                  onChange={(e) => update(idx, { name: e.target.value })}
                />
                <input
                  className="retro-input"
                  placeholder="Role / jabatan"
                  value={person.role ?? ""}
                  onChange={(e) => update(idx, { role: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-black/45">Belum ada talent — klik &quot;Baris talent&quot; atau kosongkan.</p>
      ) : null}
    </div>
  );
}
