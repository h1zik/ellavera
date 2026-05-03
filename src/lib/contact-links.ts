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
