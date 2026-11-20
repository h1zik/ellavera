/**
 * Google tag ellavera.id (dibuat dari akun Google Ads, tujuan AW-18566378554).
 *
 * Google meminta tag ini ada di SEMUA halaman, langsung setelah <head> — jadi
 * dirender di dalam <head> kedua root layout, persis seperti snippet dari Google.
 * Satu halaman cukup satu Google tag: jangan pasang Google tag lain di halaman iklan,
 * dan jangan isi ID ini lagi di Admin → Tracking iklan (nanti termuat dua kali).
 */
export const GOOGLE_TAG_ID = "GTM-W83ZM326";

const GTAG_STUB = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`;

export function GoogleTag() {
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtm.js?id=${GOOGLE_TAG_ID}`} />
      <script dangerouslySetInnerHTML={{ __html: GTAG_STUB }} />
    </>
  );
}
