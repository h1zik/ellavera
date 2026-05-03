"use client";

import { Content, SectionType } from "@prisma/client";
import {
  CONTENT_KINDS,
  KindOption,
  defaultValueForKind,
  labelForKey,
} from "@/lib/admin-content-kinds";
import * as P from "@/lib/admin-content-parsers";
import { ImageUploadField } from "@/components/admin/image-upload-field";

type Props = {
  sectionType: SectionType;
  content: Content;
  onPatch: (patch: Partial<Content>) => void;
  onRemove: () => void;
};

function buildKindOptions(sectionType: SectionType, content: Content): KindOption[] {
  const predefined = CONTENT_KINDS[sectionType] ?? [];
  if (predefined.some((p) => p.key === content.key)) {
    return predefined;
  }
  if (content.key) {
    return [
      {
        key: content.key,
        label: `Format saat ini (${content.key})`,
        valueType: content.valueType,
      },
      ...predefined.filter((p) => p.key !== content.key),
    ];
  }
  return predefined.length > 0
    ? predefined
    : [{ key: "text", label: "Teks", valueType: "TEXT" }];
}

export function ContentBlockEditor({ sectionType, content, onPatch, onRemove }: Props) {
  const kindOptions = buildKindOptions(sectionType, content);

  function handleKindChange(newKey: string) {
    const opt = kindOptions.find((k) => k.key === newKey);
    if (!opt) {
      return;
    }
    onPatch({
      key: opt.key,
      valueType: opt.valueType,
      value: defaultValueForKind(opt.key, opt.valueType),
    });
  }

  const friendlyLabel =
    labelForKey(sectionType, content.key) ?? `Item: ${content.key || "baru"}`;

  return (
    <div className="space-y-4 rounded-xl border-2 border-black/10 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-wider text-black/45">
            {friendlyLabel}
          </p>
          <label className="block text-sm font-bold text-black/80">Jenis konten</label>
          <select
            className="retro-input max-w-md text-sm"
            value={content.key}
            onChange={(e) => handleKindChange(e.target.value)}
          >
            {kindOptions.map((opt) => (
              <option key={`${opt.key}-${opt.label}`} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-black/45">
            Urutan angka di bawah menentukan posisi di halaman (kecil = lebih atas).
          </p>
        </div>
        <button
          type="button"
          className="text-[11px] font-bold uppercase text-red-600 underline"
          onClick={onRemove}
        >
          Hapus item ini
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          Urutan tampil
          <input
            className="retro-input w-24 py-2 text-sm"
            type="number"
            value={content.sortOrder}
            onChange={(e) => onPatch({ sortOrder: Number(e.target.value) })}
            min={0}
          />
        </label>
      </div>

      <div className="border-t border-black/10 pt-4">{renderValueEditor(content, onPatch)}</div>
    </div>
  );
}

function renderValueEditor(content: Content, onPatch: (patch: Partial<Content>) => void) {
  const k = content.key;

  if (k === "brand") {
    const data = P.parseBrand(content.value);
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-bold">Nama brand / klien</label>
          <input
            className="retro-input"
            value={data.name}
            onChange={(e) =>
              onPatch({
                value: JSON.stringify({ ...data, name: e.target.value }),
              })
            }
            placeholder="Contoh: Glow Labs"
          />
        </div>
        <ImageUploadField
          label="Logo brand"
          currentUrl={data.imageUrl}
          onUrlChange={(url) =>
            onPatch({
              value: JSON.stringify({ ...data, imageUrl: url }),
            })
          }
        />
      </div>
    );
  }

  if (k === "photo") {
    const data = P.parsePhoto(content.value);
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <ImageUploadField
          label="Foto"
          currentUrl={data.imageUrl}
          onUrlChange={(url) =>
            onPatch({
              value: JSON.stringify({ ...data, imageUrl: url }),
            })
          }
        />
        <div className="space-y-2">
          <label className="text-sm font-bold">Keterangan foto</label>
          <input
            className="retro-input"
            value={data.caption ?? ""}
            onChange={(e) =>
              onPatch({
                value: JSON.stringify({ ...data, caption: e.target.value }),
              })
            }
            placeholder="Contoh: Area produksi"
          />
        </div>
      </div>
    );
  }

  if (k === "faq") {
    const data = P.parseFaq(content.value);
    return (
      <div className="space-y-3">
        <div>
          <label className="text-sm font-bold">Pertanyaan</label>
          <input
            className="retro-input"
            value={data.q}
            onChange={(e) =>
              onPatch({
                value: JSON.stringify({ ...data, q: e.target.value }),
              })
            }
            placeholder="Pertanyaan yang sering ditanyakan"
          />
        </div>
        <div>
          <label className="text-sm font-bold">Jawaban</label>
          <textarea
            className="retro-input min-h-[100px]"
            value={data.a}
            onChange={(e) =>
              onPatch({
                value: JSON.stringify({ ...data, a: e.target.value }),
              })
            }
            placeholder="Jawaban singkat dan jelas"
          />
        </div>
      </div>
    );
  }

  if (k === "testimonial") {
    const data = P.parseTestimonial(content.value);
    return (
      <div className="space-y-3">
        <div>
          <label className="text-sm font-bold">Kutipan</label>
          <textarea
            className="retro-input min-h-[88px]"
            value={data.quote}
            onChange={(e) =>
              onPatch({
                value: JSON.stringify({ ...data, quote: e.target.value }),
              })
            }
            placeholder="Apa kata mereka tentang Ellavera?"
          />
        </div>
        <div>
          <label className="text-sm font-bold">Nama & role</label>
          <input
            className="retro-input"
            value={data.author}
            onChange={(e) =>
              onPatch({
                value: JSON.stringify({ ...data, author: e.target.value }),
              })
            }
            placeholder="Contoh: Raka · Founder"
          />
        </div>
      </div>
    );
  }

  if (k === "article") {
    const data = P.parseArticle(content.value);
    return (
      <div className="space-y-3">
        <input
          className="retro-input"
          value={data.title}
          onChange={(e) =>
            onPatch({
              value: JSON.stringify({ ...data, title: e.target.value }),
            })
          }
          placeholder="Judul artikel"
        />
        <textarea
          className="retro-input min-h-[72px]"
          value={data.excerpt}
          onChange={(e) =>
            onPatch({
              value: JSON.stringify({ ...data, excerpt: e.target.value }),
            })
          }
          placeholder="Ringkasan singkat"
        />
        <input
          className="retro-input"
          type="url"
          value={data.url}
          onChange={(e) =>
            onPatch({
              value: JSON.stringify({ ...data, url: e.target.value }),
            })
          }
          placeholder="https://…"
        />
      </div>
    );
  }

  if (content.valueType === "URL" || k.includes("_url")) {
    return (
      <div>
        <label className="text-sm font-bold">Tautan</label>
        <input
          className="retro-input"
          type="url"
          value={content.value}
          onChange={(e) => onPatch({ value: e.target.value })}
          placeholder="https://… atau #section"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-bold">Isi teks</label>
      <textarea
        className="retro-input min-h-[100px] text-base"
        value={content.value}
        onChange={(e) => onPatch({ value: e.target.value })}
        placeholder="Tulis konten untuk blok ini…"
      />
    </div>
  );
}
