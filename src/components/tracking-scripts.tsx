import Script from "next/script";
import {
  TRACKING_ID_PATTERNS as P,
  googleAdsIdFromSendTo,
  parseGoogleTagIds,
  validTrackingId,
} from "@/lib/tracking-ids";

export type TrackingSettings = {
  metaPixelId?: string | null;
  openaiPixelId?: string | null;
  googleTagIds?: string | null;
  googleAdsLeadSendTo?: string | null;
  googleAdsContactSendTo?: string | null;
  gtmContainerId?: string | null;
  tiktokPixelId?: string | null;
};

/** ID sudah tervalidasi regex, tapi tetap di-escape sebagai literal JS. */
const js = (v: unknown) => JSON.stringify(v);

/**
 * Memasang base code semua platform iklan yang diisi di admin (Tracking & iklan).
 * Platform yang ID-nya kosong/tidak valid tidak dirender sama sekali.
 * Event konversi (Lead / Contact) dikirim lewat `@/lib/tracking`.
 */
export function TrackingScripts({ settings }: { settings?: TrackingSettings | null }) {
  const metaId = validTrackingId(settings?.metaPixelId, P.meta);
  const openaiId = validTrackingId(settings?.openaiPixelId, P.openai);
  const gtmId = validTrackingId(settings?.gtmContainerId?.toUpperCase(), P.gtm);
  const tiktokId = validTrackingId(settings?.tiktokPixelId?.toUpperCase(), P.tiktok);
  const adsLead = validTrackingId(settings?.googleAdsLeadSendTo, P.googleAdsSendTo);
  const adsContact = validTrackingId(settings?.googleAdsContactSendTo, P.googleAdsSendTo);

  /** Akun Ads dari label konversi ikut di-config walau tidak ditulis di "Google tag ID". */
  const googleIds = Array.from(
    new Set([
      ...parseGoogleTagIds(settings?.googleTagIds).filter((id) => P.googleTag.test(id)),
      ...[adsLead, adsContact].filter(Boolean).map((s) => googleAdsIdFromSendTo(s!)),
    ]),
  );

  return (
    <>
      {openaiId ? (
        // Snippet resmi OpenAI Measurement Pixel (developers.openai.com/ads/measurement-pixel).
        <Script id="openai-pixel-base" strategy="afterInteractive">
          {`(function (w, d, s, u) {
  if (w.oaiq) return;
  var q = function () {
    q.q.push(arguments);
  };
  q.q = [];
  w.oaiq = q;
  var js = d.createElement(s);
  js.async = true;
  js.src = u;
  var f = d.getElementsByTagName(s)[0];
  f.parentNode.insertBefore(js, f);
})(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");
oaiq("init", { pixelId: ${js(openaiId)} });
oaiq("measure", "page_viewed", {
  type: "contents",
  contents: [{ id: location.pathname, name: document.title, content_type: "page" }],
});`}
        </Script>
      ) : null}

      {metaId ? (
        <>
          <Script id="meta-pixel-base" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${js(metaId)});
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element -- pixel fallback tanpa JS */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      ) : null}

      {googleIds.length > 0 ? (
        <>
          <Script
            id="google-tag-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleIds[0]!)}`}
          />
          <Script id="google-tag-base" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
${googleIds.map((id) => `gtag('config', ${js(id)});`).join("\n")}
window.__ellaveraAds = { lead: ${js(adsLead ?? "")}, contact: ${js(adsContact ?? "")} };`}
          </Script>
        </>
      ) : null}

      {gtmId ? (
        <>
          <Script id="gtm-base" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${js(gtmId)});`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="gtm"
            />
          </noscript>
        </>
      ) : null}

      {tiktokId ? (
        <Script id="tiktok-pixel-base" strategy="afterInteractive">
          {`!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load(${js(tiktokId)});
  ttq.page();
}(window, document, 'ttq');`}
        </Script>
      ) : null}
    </>
  );
}
