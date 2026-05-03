export type TalentCard = {
  imageUrl: string;
  name?: string;
  role?: string;
};

/** Untuk admin: pertahankan baris meski belum ada URL. */
export function parseTalentGalleryDraft(json: string | null | undefined): TalentCard[] {
  if (!json?.trim()) {
    return [];
  }
  try {
    const data = JSON.parse(json) as unknown;
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map((item) => {
      if (item && typeof item === "object" && "imageUrl" in item) {
        const rec = item as Record<string, unknown>;
        return {
          imageUrl: typeof rec.imageUrl === "string" ? rec.imageUrl : "",
          name: typeof rec.name === "string" ? rec.name : undefined,
          role: typeof rec.role === "string" ? rec.role : undefined,
        } satisfies TalentCard;
      }
      return { imageUrl: "" };
    });
  } catch {
    return [];
  }
}

export function parseTalentGallery(json: string | null | undefined): TalentCard[] {
  if (!json?.trim()) {
    return [];
  }
  try {
    const data = JSON.parse(json) as unknown;
    if (!Array.isArray(data)) {
      return [];
    }
    const items: TalentCard[] = [];
    for (const item of data) {
      if (item && typeof item === "object" && "imageUrl" in item) {
        const rec = item as Record<string, unknown>;
        const imageUrl = typeof rec.imageUrl === "string" ? rec.imageUrl.trim() : "";
        if (!imageUrl) {
          continue;
        }
        items.push({
          imageUrl,
          name: typeof rec.name === "string" ? rec.name : undefined,
          role: typeof rec.role === "string" ? rec.role : undefined,
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}
