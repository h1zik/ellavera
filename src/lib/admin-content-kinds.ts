import { ContentValueType, SectionType } from "@prisma/client";

export type KindOption = {
  key: string;
  label: string;
  valueType: ContentValueType;
};

/** Opsi dropdown per tipe section — pengguna tidak perlu tahu key internal. */
export const CONTENT_KINDS: Partial<Record<SectionType, KindOption[]>> = {
  [SectionType.HERO]: [
    { key: "cta_primary_label", label: "Teks tombol utama", valueType: "TEXT" },
    { key: "cta_primary_url", label: "Link tombol utama", valueType: "URL" },
    { key: "cta_secondary_label", label: "Teks tombol sekunder", valueType: "TEXT" },
    { key: "cta_secondary_url", label: "Link tombol sekunder", valueType: "URL" },
  ],
  [SectionType.SERVICES]: [{ key: "service", label: "Item layanan", valueType: "TEXT" }],
  [SectionType.PROCESS]: [{ key: "step", label: "Langkah proses", valueType: "TEXT" }],
  [SectionType.WHY_US]: [{ key: "point", label: "Alasan / poin", valueType: "TEXT" }],
  [SectionType.CLIENT_PORTFOLIO]: [{ key: "brand", label: "Logo klien", valueType: "JSON" }],
  [SectionType.FACTORY_GALLERY]: [{ key: "photo", label: "Foto lokasi / pabrik", valueType: "JSON" }],
  [SectionType.FAQ]: [{ key: "faq", label: "Pertanyaan & jawaban", valueType: "JSON" }],
  [SectionType.TESTIMONIALS]: [{ key: "testimonial", label: "Testimoni", valueType: "JSON" }],
  [SectionType.EDUCATIONAL]: [{ key: "article", label: "Artikel / tautan", valueType: "JSON" }],
};

export function defaultKindForSection(sectionType: SectionType): KindOption {
  const list = CONTENT_KINDS[sectionType];
  return (
    list?.[0] ?? {
      key: "text",
      label: "Teks",
      valueType: "TEXT",
    }
  );
}

export function defaultValueForKind(key: string, valueType: ContentValueType): string {
  if (valueType !== "JSON") {
    return "";
  }
  switch (key) {
    case "brand":
      return JSON.stringify({ name: "", imageUrl: "" });
    case "photo":
      return JSON.stringify({ imageUrl: "", caption: "" });
    case "faq":
      return JSON.stringify({ q: "", a: "" });
    case "testimonial":
      return JSON.stringify({ quote: "", author: "" });
    case "article":
      return JSON.stringify({ title: "", excerpt: "", url: "" });
    default:
      return "{}";
  }
}

export function labelForKey(sectionType: SectionType, key: string): string | undefined {
  const list = CONTENT_KINDS[sectionType];
  return list?.find((k) => k.key === key)?.label;
}
