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
  /** Posisi 1-based untuk ditampilkan, mis. "Item 2 dari 5". */
  position: number;
  total: number;
  onPatch: (patch: Partial<Content>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
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

export function ContentBlockEditor({
  sectionType,
  content,
  position,
  total,
  onPatch,
  onRemove,
  onMove,
}: Props) {
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
    <div className="admin-item">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="admin-item-pos" aria-hidden>
            {position}
          </span>
          <p className="truncate text-sm font-black text-black/80">
            {friendlyLabel}
            <span className="sr-only">
              , item {position} dari {total}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => onMove(-1)}
            disabled={position === 1}
            aria-label="Pindah ke atas"
            title="Pindah ke atas"
          >
            ↑
          </button>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => onMove(1)}
            disabled={position === total}
            aria-label="Pindah ke bawah"
            title="Pindah ke bawah"
          >
            ↓
          </button>
          <button
            type="button"
            className="admin-icon-btn admin-icon-btn--danger"
            onClick={() => {
              if (confirm(`Hapus "${friendlyLabel}" ini? Berlaku setelah disimpan.`)) onRemove();
            }}
            aria-label="Hapus item"
            title="Hapus item"
          >
            ✕
          </button>
        </div>
      </div>

      {kindOptions.length > 1 ? (
        <label className="block max-w-md text-xs font-bold text-black/70">
          Jenis konten
          <select
            className="retro-input mt-1 py-2 text-sm"
            value={content.key}
            onChange={(e) => handleKindChange(e.target.value)}
          >
            {kindOptions.map((opt) => (
              <option key={`${opt.key}-${opt.label}`} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div>{renderValueEditor(content, onPatch)}</div>
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

  if (content.valueType === "IMAGE_URL") {
    return (
      <ImageUploadField
        label="Gambar"
        currentUrl={content.value}
        onUrlChange={(url) => onPatch({ value: url })}
        widePreview
      />
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
        {k === "cta_pricelist_url" ? (
          <p className="mt-1 text-xs text-black/55">
            Tampil di Hero & Kontak, dibuka di tab baru. Isi tanda &quot;-&quot; untuk
            menyembunyikan tombol.
          </p>
        ) : null}
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
