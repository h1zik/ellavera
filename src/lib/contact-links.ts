/** Bangun tautan wa.me dari nomor bebas format (ID). */
export function toWhatsAppHref(raw: string | null | undefined): string {
  if (!raw?.trim()) {
    return "#";
  }
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  }
  if (!digits) {
    return "#";
  }
  return `https://wa.me/${digits}`;
}

/** Link pricelist white label bawaan — bisa ditimpa lewat item "Link pricelist" di section Hero. */
export const DEFAULT_PRICELIST_URL = "https://bit.ly/Price_List_Ellavera";
export const DEFAULT_PRICELIST_LABEL = "Lihat pricelist white label";

export type PricelistLink = { label: string; url: string };
