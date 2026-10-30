"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { AdminSiteSettings } from "@/lib/admin-settings";
import { TRACKING_ID_PATTERNS, invalidGoogleTagIds } from "@/lib/tracking-ids";
import { ImageUploadField } from "./image-upload-field";
import { LeadFormFieldsEditor } from "./lead-form-fields-editor";
import { TalentGalleryEditor } from "./talent-gallery-editor";
import { ButtonEventsEditor } from "./button-events-editor";

export type SettingsTab = "merek" | "kontak" | "form" | "seo" | "tracking";

type Key = keyof AdminSiteSettings;

/** Field per tab — untuk penanda "belum disimpan" & lompat ke tab yang error. */
const TAB_FIELDS: Record<SettingsTab, readonly string[]> = {
  merek: [
    "siteName",
    "tagline",
    "headerEyebrow",
    "heroKicker",
    "brandPurpose",
    "primaryColor",
    "secondaryColor",
    "accentColor",
    "siteLogoUrl",
    "heroImageUrl",
    "faviconUrl",
    "adminLogoUrl",
    "talentGalleryJson",
  ],
  kontak: ["contactEmail", "contactWhatsapp", "locationAddress", "mapsUrl"],
  form: [
    "leadFormFieldsJson",
    "leadNotifyEmail",
    "smtpHost",
    "smtpPort",
    "smtpSecure",
    "smtpUser",
    "smtpFrom",
    "smtpPassword",
    "smtpPasswordClear",
  ],
  seo: ["seoTitle", "seoDescription", "seoKeywords"],
  tracking: [
    "metaPixelId",
    "openaiPixelId",
    "googleTagIds",
    "googleAdsLeadSendTo",
    "googleAdsContactSendTo",
    "gtmContainerId",
    "tiktokPixelId",
    "buttonEventsJson",
  ],
};

const TABS: { id: SettingsTab; label: string; title: string; lede: string }[] = [
  {
    id: "merek",
    label: "Merek",
    title: "Merek & tampilan",
    lede: "Nama, teks pendek, warna, dan gambar yang membentuk tampilan beranda.",
  },
  {
    id: "kontak",
    label: "Kontak",
    title: "Kontak",
    lede: "Cara pengunjung menghubungi Ellavera. Tampil di section kontak dan tombol WhatsApp.",
  },
  {
    id: "form",
    label: "Form & notifikasi",
    title: "Form brief & notifikasi",
    lede: "Pertanyaan di form brief, dan ke mana email pemberitahuannya dikirim.",
  },
  {
    id: "seo",
    label: "SEO",
    title: "Tampilan di Google",
    lede: "Judul dan deskripsi yang muncul di hasil pencarian dan saat link dibagikan.",
  },
  {
    id: "tracking",
    label: "Tracking iklan",
    title: "Tracking iklan",
    lede: "Tempel ID dari tiap platform iklan. Kolom kosong berarti platform itu tidak dipasang.",
  },
];

function isHexColor(v: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(v);
}

/* ───────────── Komponen kecil ───────────── */

function Row({
  id,
  label,
  hint,
  aside,
  error,
  stacked,
  children,
}: {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  aside?: ReactNode;
  error?: string[];
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={stacked ? "set-row set-row--stacked" : "set-row"}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {id ? (
            <label htmlFor={id} className="set-row-label">
              {label}
            </label>
          ) : (
            <p className="set-row-label">{label}</p>
          )}
          {aside}
        </div>
        {hint ? <p className="set-row-hint">{hint}</p> : null}
      </div>
      <div className="set-row-control">
        {children}
        {error?.length ? (
          <p role="alert" className="set-row-error">
            {error.join(" ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CharCount({ value, ideal }: { value: string; ideal: number }) {
  const over = value.length > ideal;
  return (
    <span className={["text-xs", over ? "font-bold text-amber-700" : "text-black/45"].join(" ")}>
      {value.length}/{ideal}
      {over ? " · bisa terpotong" : ""}
    </span>
  );
}

function ColorField({
  label,
  usage,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  usage: string;
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
}) {
  // Teks hex boleh setengah diketik; baru dikirim ke state saat formatnya valid.
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-bold">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: pilih warna`}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border-2 border-black/15 bg-white p-0.5"
          value={isHexColor(value) ? value : defaultValue}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="retro-input py-2 font-mono text-sm uppercase"
          aria-label={`${label}: kode hex`}
          value={draft}
          maxLength={7}
          onChange={(e) => {
            const next = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setDraft(next);
            if (isHexColor(next)) onChange(next);
          }}
          onBlur={() => setDraft(value)}
        />
      </div>
      <p className="text-xs text-black/50">
        {usage}
        {value.toLowerCase() !== defaultValue.toLowerCase() ? (
          <>
            {" "}
            <button
              type="button"
              className="font-bold text-black/60 underline underline-offset-2 hover:text-black"
              onClick={() => onChange(defaultValue)}
            >
              Kembalikan
            </button>
          </>
        ) : null}
      </p>
    </div>
  );
}

function ImageSetting({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  invalid?: boolean;
}) {
  return (
    <div className="set-image">
      <div className="set-image-thumb admin-checker">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL bebas dari admin
          <img src={value} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <span>Belum ada gambar</span>
        )}
      </div>
      <div className="min-w-0 flex-1 basis-64 space-y-2">
        <ImageUploadField compact hidePreview currentUrl={value} onUrlChange={onChange} />
        <div className="flex items-center gap-3">
          <input
            id={id}
            className="retro-input py-2 text-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="atau tempel URL gambar"
            aria-invalid={invalid || undefined}
          />
          {value ? (
            <button
              type="button"
              className="shrink-0 text-xs font-bold text-red-700 underline underline-offset-2"
              onClick={() => onChange("")}
            >
              Hapus
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type TrackingState = "on" | "bad" | "off";

function TrackingChip({ state }: { state: TrackingState }) {
  if (state === "off") return null;
  return state === "on" ? (
    <span className="set-chip set-chip--on">Aktif</span>
  ) : (
    <span className="set-chip set-chip--bad">Format salah</span>
  );
}

function trackingState(value: string | null | undefined, valid: (v: string) => boolean): TrackingState {
  const v = value?.trim() ?? "";
  if (!v) return "off";
  return valid(v) ? "on" : "bad";
}

/* ───────────── Panel ───────────── */

type Props = {
  settings: AdminSiteSettings;
  setSettings: Dispatch<SetStateAction<AdminSiteSettings>>;
  savedSettingsJson: string;
  smtpPassword: string;
  setSmtpPassword: (v: string) => void;
  smtpPasswordClear: boolean;
  setSmtpPasswordClear: (v: boolean) => void;
  fieldErrors: Record<string, string[]>;
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  pushToast: (message: string, variant?: "success" | "error") => void;
  /** Bar simpan (sticky) dari dashboard. */
  footer: ReactNode;
};

export function SettingsPanel({
  settings,
  setSettings,
  savedSettingsJson,
  smtpPassword,
  setSmtpPassword,
  smtpPasswordClear,
  setSmtpPasswordClear,
  fieldErrors,
  tab,
  onTabChange,
  pushToast,
  footer,
}: Props) {
  const [testingEmail, setTestingEmail] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  /** Ganti tab; kalau sedang di tengah halaman, gulir ke awal isi tab supaya judulnya terlihat. */
  function openTab(next: SettingsTab) {
    onTabChange(next);
    const el = panelRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ block: "start" });
    }
  }
  const saved = useMemo(
    () => JSON.parse(savedSettingsJson) as Record<string, unknown>,
    [savedSettingsJson],
  );

  const dirtyTabs = useMemo(() => {
    const current = settings as unknown as Record<string, unknown>;
    const out = new Set<SettingsTab>();
    for (const t of TABS) {
      const changed = TAB_FIELDS[t.id].some(
        (k) => k in current && JSON.stringify(current[k] ?? null) !== JSON.stringify(saved[k] ?? null),
      );
      if (changed) out.add(t.id);
    }
    if (smtpPassword !== "" || smtpPasswordClear) out.add("form");
    return out;
  }, [settings, saved, smtpPassword, smtpPasswordClear]);

  const errorTabs = useMemo(() => {
    const keys = Object.keys(fieldErrors);
    return new Set(TABS.filter((t) => TAB_FIELDS[t.id].some((k) => keys.includes(k))).map((t) => t.id));
  }, [fieldErrors]);

  // Simpan gagal → buka tab pertama yang punya kolom bermasalah.
  useEffect(() => {
    const first = TABS.find((t) => errorTabs.has(t.id));
    if (first) onTabChange(first.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya saat error baru masuk
  }, [fieldErrors]);

  const tracking = {
    meta: trackingState(settings.metaPixelId, (v) => TRACKING_ID_PATTERNS.meta.test(v)),
    openai: trackingState(settings.openaiPixelId, (v) => TRACKING_ID_PATTERNS.openai.test(v)),
    google: trackingState(settings.googleTagIds, (v) => invalidGoogleTagIds(v).length === 0),
    tiktok: trackingState(settings.tiktokPixelId, (v) =>
      TRACKING_ID_PATTERNS.tiktok.test(v.toUpperCase()),
    ),
    adsLead: trackingState(settings.googleAdsLeadSendTo, (v) =>
      TRACKING_ID_PATTERNS.googleAdsSendTo.test(v),
    ),
    adsContact: trackingState(settings.googleAdsContactSendTo, (v) =>
      TRACKING_ID_PATTERNS.googleAdsSendTo.test(v),
    ),
    gtm: trackingState(settings.gtmContainerId, (v) => TRACKING_ID_PATTERNS.gtm.test(v.toUpperCase())),
  };
  const activeTracking = [tracking.meta, tracking.openai, tracking.google, tracking.tiktok, tracking.gtm]
    .filter((s) => s === "on").length;

  /** Props input teks standar. Mengosongkan field yang aslinya null → kembali null (tidak dianggap berubah). */
  function bind(key: Key) {
    const id = `set-${String(key)}`;
    return {
      id,
      value: (settings[key] as string | null | undefined) ?? "",
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const v = e.target.value;
        setSettings((prev) => ({ ...prev, [key]: v === "" && saved[key] === null ? null : v }));
      },
      "aria-invalid": fieldErrors[key as string] ? true : undefined,
    };
  }

  function set<K extends Key>(key: K, value: AdminSiteSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  /** Pesan server kadang diawali nama field teknis ("metaPixelId: …") — buang prefiksnya. */
  const err = (key: string) =>
    fieldErrors[key]?.map((m) => {
      const t = m.replace(/^[A-Za-z]+:\s*/, "");
      return t.charAt(0).toUpperCase() + t.slice(1);
    });
  const active = TABS.find((t) => t.id === tab) ?? TABS[0]!;

  async function sendTestEmail() {
    setTestingEmail(true);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      pushToast(
        data.message || (res.ok ? "Email tes terkirim." : "Email tes gagal dikirim."),
        res.ok ? "success" : "error",
      );
    } catch {
      pushToast("Tidak bisa menghubungi server.", "error");
    } finally {
      setTestingEmail(false);
    }
  }

  const seoTitle = settings.seoTitle?.trim() || settings.siteName;
  const seoDesc =
    settings.seoDescription?.trim() || "Belum ada deskripsi. Google akan mengambil teks acak dari halaman.";

  return (
    <section className="admin-content-card pt-6 md:pt-8">
      <h2 className="text-2xl font-black tracking-tight text-[var(--retro-black)] md:text-3xl">
        Pengaturan situs
      </h2>
      <p className="mt-1 text-sm text-black/60">
        Perubahan tampil di beranda setelah kamu menekan Simpan.
      </p>

      <div className="set-tabs" role="tablist" aria-label="Kelompok pengaturan">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`set-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="set-tabpanel"
            className="set-tab"
            onClick={() => openTab(t.id)}
          >
            {t.label}
            {t.id === "tracking" && activeTracking > 0 ? (
              <span className="set-tab-meta">{activeTracking}</span>
            ) : null}
            {errorTabs.has(t.id) ? (
              <span className="set-tab-error" title="Ada kolom yang perlu diperbaiki" />
            ) : dirtyTabs.has(t.id) ? (
              <span className="admin-dot admin-dot--dirty" title="Belum disimpan" />
            ) : null}
          </button>
        ))}
      </div>

      <div
        id="set-tabpanel"
        role="tabpanel"
        aria-labelledby={`set-tab-${active.id}`}
        ref={panelRef}
        className="scroll-mt-20 pt-6"
      >
        <h3 className="set-pane-title">{active.title}</h3>
        <p className="set-pane-lede">{active.lede}</p>

        {tab === "merek" ? (
          <>
            <h4 className="set-subhead">Nama & teks</h4>
            <div className="set-rows">
              <Row id="set-siteName" label="Nama situs" hint="Dipakai di footer, judul tab, dan teks alternatif logo." error={err("siteName")}>
                <input className="retro-input" {...bind("siteName")} placeholder="Ellavera" />
              </Row>
              <Row id="set-tagline" label="Tagline" hint="Satu kalimat di bawah logo header." error={err("tagline")}>
                <input className="retro-input" {...bind("tagline")} placeholder="Maklon kosmetik buat Gen-Z & brand owner" />
              </Row>
              <Row id="set-headerEyebrow" label="Teks kecil di atas logo" hint="Kosongkan untuk menyembunyikan." error={err("headerEyebrow")}>
                <input className="retro-input" {...bind("headerEyebrow")} placeholder="Maklon · Gen-Z · Unisex" maxLength={120} />
              </Row>
              <Row id="set-heroKicker" label="Teks kecil di atas judul hero" hint="Kosongkan untuk menyembunyikan." error={err("heroKicker")}>
                <input className="retro-input" {...bind("heroKicker")} placeholder="Retro · Playful · High-energy" maxLength={120} />
              </Row>
              <Row id="set-brandPurpose" label="Teks footer" hint="Misi singkat di bagian paling bawah halaman." error={err("brandPurpose")}>
                <textarea className="retro-input min-h-[88px]" {...bind("brandPurpose")} placeholder="Misi singkat Ellavera" />
              </Row>
            </div>

            <h4 className="set-subhead">Warna</h4>
            <div className="set-rows">
              <Row label="Warna tema" hint="Berlaku untuk beranda dan panel admin ini.">
                <div className="grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      ["primaryColor", "Utama", "Tombol & bayangan kartu.", "#26CCC2"],
                      ["secondaryColor", "Sekunder", "Latar kartu section.", "#FAE3C7"],
                      ["accentColor", "Aksen", "Tombol kedua & sorotan.", "#FFB76C"],
                    ] as const
                  ).map(([key, label, usage, fallback]) => (
                    <ColorField
                      key={key}
                      label={label}
                      usage={usage}
                      defaultValue={fallback}
                      value={settings[key]}
                      onChange={(v) => set(key, v)}
                    />
                  ))}
                </div>
              </Row>
            </div>

            <h4 className="set-subhead">Logo & gambar</h4>
            <div className="set-rows">
              <Row id="set-siteLogoUrl" label="Logo header" hint="Menggantikan teks nama situs di header. PNG transparan paling rapi." error={err("siteLogoUrl")}>
                <ImageSetting id="set-siteLogoUrl" value={settings.siteLogoUrl ?? ""} onChange={(u) => set("siteLogoUrl", u)} invalid={!!err("siteLogoUrl")} />
              </Row>
              <Row id="set-heroImageUrl" label="Gambar hero" hint="Gambar besar di bagian pembuka beranda." error={err("heroImageUrl")}>
                <ImageSetting id="set-heroImageUrl" value={settings.heroImageUrl ?? ""} onChange={(u) => set("heroImageUrl", u)} invalid={!!err("heroImageUrl")} />
              </Row>
              <Row id="set-faviconUrl" label="Favicon" hint="Ikon kecil di tab browser. Pakai gambar persegi." error={err("faviconUrl")}>
                <ImageSetting id="set-faviconUrl" value={settings.faviconUrl ?? ""} onChange={(u) => set("faviconUrl", u)} invalid={!!err("faviconUrl")} />
              </Row>
              <Row id="set-adminLogoUrl" label="Logo halaman login admin" error={err("adminLogoUrl")}>
                <ImageSetting id="set-adminLogoUrl" value={settings.adminLogoUrl ?? ""} onChange={(u) => set("adminLogoUrl", u)} invalid={!!err("adminLogoUrl")} />
              </Row>
            </div>

            <details className="set-more mt-6">
              <summary>Foto tim</summary>
              <div className="set-more-body">
                <p className="set-row-hint mb-4">
                  Foto, nama, dan peran anggota tim. Saat ini belum ditampilkan di beranda.
                </p>
                <TalentGalleryEditor
                  json={settings.talentGalleryJson}
                  onChange={(talentGalleryJson) => set("talentGalleryJson", talentGalleryJson)}
                />
              </div>
            </details>
          </>
        ) : null}

        {tab === "kontak" ? (
          <div className="set-rows mt-6">
            <Row id="set-contactEmail" label="Email" hint="Tampil di section kontak." error={err("contactEmail")}>
              <input className="retro-input" type="email" {...bind("contactEmail")} placeholder="halo@ellavera.id" />
            </Row>
            <Row id="set-contactWhatsapp" label="Nomor WhatsApp" hint="Format bebas: +62…, 08…, boleh pakai spasi. Link wa.me dibuat otomatis." error={err("contactWhatsapp")}>
              <input className="retro-input" {...bind("contactWhatsapp")} placeholder="+62 812 3456 7890" inputMode="tel" autoComplete="tel" />
            </Row>
            <Row id="set-locationAddress" label="Alamat kantor / pabrik" error={err("locationAddress")}>
              <textarea className="retro-input min-h-[88px]" {...bind("locationAddress")} placeholder="Jl. …, Kota, Provinsi" />
            </Row>
            <Row id="set-mapsUrl" label="Link Google Maps" hint="Untuk tombol peta. https:// ditambahkan otomatis." error={err("mapsUrl")}>
              <input className="retro-input" {...bind("mapsUrl")} placeholder="https://maps.app.goo.gl/…" inputMode="url" />
            </Row>
          </div>
        ) : null}

        {tab === "form" ? (
          <>
            <h4 className="set-subhead">Pertanyaan di form brief</h4>
            <div className="set-rows">
              <div className="set-row set-row--stacked">
                <p className="set-row-hint mt-0 max-w-none">
                  Urutan di sini sama dengan urutan di form. Harus ada satu pertanyaan bertipe Email
                  yang wajib diisi.
                </p>
                <LeadFormFieldsEditor
                  json={settings.leadFormFieldsJson}
                  onChange={(leadFormFieldsJson) => set("leadFormFieldsJson", leadFormFieldsJson)}
                />
              </div>
            </div>

            <h4 className="set-subhead">Notifikasi email</h4>
            <div className="set-rows">
              <Row
                id="set-leadNotifyEmail"
                label="Kirim notifikasi ke"
                hint="Pisahkan dengan koma. Kosong berarti dikirim ke email kontak. Lead tetap tersimpan di menu Leads walau email gagal."
                error={err("leadNotifyEmail")}
              >
                <input className="retro-input" {...bind("leadNotifyEmail")} placeholder="sales@ellavera.id, owner@ellavera.id" inputMode="email" />
              </Row>
              <Row
                label="Akun pengirim (SMTP)"
                hint={
                  <>
                    Gmail: host <code>smtp.gmail.com</code>, port <code>587</code>, password pakai
                    App Password. Kosongkan semua untuk memakai pengaturan server.
                  </>
                }
                error={[...(err("smtpHost") ?? []), ...(err("smtpPort") ?? []), ...(err("smtpUser") ?? [])]}
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
                  <label className="set-mini-label">
                    Host
                    <input className="retro-input mt-1" {...bind("smtpHost")} placeholder="smtp.gmail.com" autoComplete="off" />
                  </label>
                  <label className="set-mini-label">
                    Port
                    <input
                      className="retro-input mt-1"
                      id="set-smtpPort"
                      value={settings.smtpPort == null ? "" : String(settings.smtpPort)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        set("smtpPort", raw ? Number.parseInt(raw, 10) : null);
                      }}
                      aria-invalid={err("smtpPort") ? true : undefined}
                      placeholder="587"
                      inputMode="numeric"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="set-mini-label">
                    Username
                    <input className="retro-input mt-1" {...bind("smtpUser")} placeholder="akun@gmail.com" autoComplete="off" />
                  </label>
                  <label className="set-mini-label">
                    Password / App Password
                    <input
                      type="password"
                      className="retro-input mt-1"
                      value={smtpPassword}
                      onChange={(e) => {
                        setSmtpPassword(e.target.value);
                        if (e.target.value) setSmtpPasswordClear(false);
                      }}
                      placeholder={settings.smtpPasswordSet ? "Tersimpan, isi untuk mengganti" : "Belum diisi"}
                      autoComplete="new-password"
                      disabled={smtpPasswordClear}
                    />
                  </label>
                </div>
                {settings.smtpPasswordSet || !settings.smtpPasswordEncrypted ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-black/55">
                    {!settings.smtpPasswordEncrypted ? (
                      <span className="font-bold text-amber-800">
                        Password belum terenkripsi: set SMTP_CRYPT_KEY di server.
                      </span>
                    ) : null}
                    {settings.smtpPasswordSet ? (
                      <label className="inline-flex items-center gap-1.5 font-bold text-black/70">
                        <input
                          type="checkbox"
                          checked={smtpPasswordClear}
                          onChange={(e) => {
                            setSmtpPasswordClear(e.target.checked);
                            if (e.target.checked) setSmtpPassword("");
                          }}
                        />
                        Hapus password tersimpan
                      </label>
                    ) : null}
                  </div>
                ) : null}

                <details className="set-more">
                  <summary>Koneksi & alamat pengirim</summary>
                  <div className="grid gap-3 pb-4 sm:grid-cols-2">
                    <label className="set-mini-label">
                      Koneksi aman
                      <select
                        className="retro-input mt-1"
                        value={settings.smtpSecure == null ? "auto" : settings.smtpSecure ? "true" : "false"}
                        onChange={(e) =>
                          set("smtpSecure", e.target.value === "auto" ? null : e.target.value === "true")
                        }
                      >
                        <option value="auto">Otomatis (SSL kalau port 465)</option>
                        <option value="true">Selalu SSL (port 465)</option>
                        <option value="false">STARTTLS (port 587)</option>
                      </select>
                    </label>
                    <label className="set-mini-label">
                      Alamat pengirim (From)
                      <input className="retro-input mt-1" {...bind("smtpFrom")} placeholder="Ellavera <no-reply@ellavera.id>" />
                      <span className="mt-1 block font-normal text-black/50">Kosong = sama dengan username.</span>
                    </label>
                  </div>
                </details>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    className="retro-button-alt px-4 py-2 text-xs disabled:opacity-60"
                    disabled={testingEmail}
                    onClick={sendTestEmail}
                  >
                    {testingEmail ? "Mengirim…" : "Kirim email tes"}
                  </button>
                  <span className="text-xs text-black/55">Memakai data yang sudah tersimpan, jadi simpan dulu.</span>
                </div>
              </Row>
            </div>
          </>
        ) : null}

        {tab === "seo" ? (
          <>
            <div className="set-serp" aria-label="Pratinjau di hasil Google">
              <div className="set-serp-url">
                <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-[#f1f3f4]">
                  {settings.faviconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL bebas dari admin
                    <img src={settings.faviconUrl} alt="" className="h-4 w-4 object-contain" />
                  ) : null}
                </span>
                <span>
                  <span className="block font-medium">{settings.siteName}</span>
                  <span className="block text-black/55">ellavera.id</span>
                </span>
              </div>
              <p className="set-serp-title">{seoTitle}</p>
              <p className="set-serp-desc">{seoDesc}</p>
            </div>
            <p className="mt-2 text-xs text-black/50">Pratinjau perkiraan. Google bisa saja menulis ulang judul dan deskripsi.</p>

            <div className="set-rows mt-6">
              <Row
                id="set-seoTitle"
                label="Judul"
                aside={<CharCount value={settings.seoTitle ?? ""} ideal={60} />}
                hint="Juga tampil di tab browser."
                error={err("seoTitle")}
              >
                <input className="retro-input" {...bind("seoTitle")} placeholder="Ellavera | Maklon kosmetik Gen-Z" />
              </Row>
              <Row
                id="set-seoDescription"
                label="Deskripsi"
                aside={<CharCount value={settings.seoDescription ?? ""} ideal={160} />}
                hint="Satu-dua kalimat yang membuat orang mau klik."
                error={err("seoDescription")}
              >
                <textarea className="retro-input min-h-[88px]" {...bind("seoDescription")} placeholder="Private label skincare & bodycare: cepat, legal, …" />
              </Row>
              <Row id="set-seoKeywords" label="Kata kunci" hint="Opsional. Google sudah tidak memakainya untuk peringkat." error={err("seoKeywords")}>
                <input className="retro-input" {...bind("seoKeywords")} placeholder="maklon kosmetik, private label, skincare" />
              </Row>
            </div>
          </>
        ) : null}

        {tab === "tracking" ? (
          <>
            <div className="set-rows mt-6">
              <Row
                id="set-metaPixelId"
                label="Meta (Facebook & Instagram)"
                aside={<TrackingChip state={tracking.meta} />}
                hint="Events Manager → Data sources → Pixel ID. Hanya angka."
                error={err("metaPixelId")}
              >
                <input className="retro-input font-mono text-sm" {...bind("metaPixelId")} placeholder="1234567890123456" inputMode="numeric" autoComplete="off" spellCheck={false} />
              </Row>
              <Row
                id="set-openaiPixelId"
                label="ChatGPT Ads (OpenAI)"
                aside={<TrackingChip state={tracking.openai} />}
                hint="Ads Manager → Conversions → Set up your data source → Pixel ID. Cukup ID-nya, bukan seluruh kode."
                error={err("openaiPixelId")}
              >
                <input className="retro-input font-mono text-sm" {...bind("openaiPixelId")} placeholder="4Z2Ks9o7mVYepwJ9K7BNXh" autoComplete="off" spellCheck={false} />
              </Row>
              <Row
                id="set-googleTagIds"
                label="Google Analytics / Google Ads"
                aside={<TrackingChip state={tracking.google} />}
                hint="ID G-… (Analytics) dan/atau AW-… (Ads). Pisahkan dengan koma."
                error={err("googleTagIds")}
              >
                <input className="retro-input font-mono text-sm" {...bind("googleTagIds")} placeholder="G-ABC123XYZ, AW-123456789" autoComplete="off" spellCheck={false} />
              </Row>
              <Row
                id="set-tiktokPixelId"
                label="TikTok"
                aside={<TrackingChip state={tracking.tiktok} />}
                hint="TikTok Ads Manager → Events → Web events → Pixel ID."
                error={err("tiktokPixelId")}
              >
                <input className="retro-input font-mono text-sm" {...bind("tiktokPixelId")} placeholder="C1A2B3C4D5E6F7G8H9I0" autoComplete="off" spellCheck={false} />
              </Row>
            </div>

            <details
              className="set-more"
              open={
                Boolean(
                  settings.googleAdsLeadSendTo ||
                    settings.googleAdsContactSendTo ||
                    settings.gtmContainerId ||
                    err("googleAdsLeadSendTo") ||
                    err("googleAdsContactSendTo") ||
                    err("gtmContainerId"),
                ) || undefined
              }
            >
              <summary>Konversi Google Ads & Google Tag Manager</summary>
              <div className="set-more-body">
                <Row
                  id="set-googleAdsLeadSendTo"
                  label="Konversi Google Ads: kirim brief"
                  aside={<TrackingChip state={tracking.adsLead} />}
                  hint="Google Ads → Conversions → Tag setup → nilai send_to."
                  error={err("googleAdsLeadSendTo")}
                >
                  <input className="retro-input font-mono text-sm" {...bind("googleAdsLeadSendTo")} placeholder="AW-123456789/AbCdEfGh" autoComplete="off" spellCheck={false} />
                </Row>
                <Row
                  id="set-googleAdsContactSendTo"
                  label="Konversi Google Ads: klik WhatsApp"
                  aside={<TrackingChip state={tracking.adsContact} />}
                  error={err("googleAdsContactSendTo")}
                >
                  <input className="retro-input font-mono text-sm" {...bind("googleAdsContactSendTo")} placeholder="AW-123456789/XyZ123" autoComplete="off" spellCheck={false} />
                </Row>
                <Row
                  id="set-gtmContainerId"
                  label="Google Tag Manager"
                  aside={<TrackingChip state={tracking.gtm} />}
                  hint={
                    <>
                      Untuk platform lain (LinkedIn, X, Pinterest…). Pakai trigger Custom Event{" "}
                      <code>ellavera_lead</code> dan <code>ellavera_contact</code>. Jangan pasang
                      platform yang sama di sini dan di GTM sekaligus, nanti terhitung dua kali.
                    </>
                  }
                  error={err("gtmContainerId")}
                >
                  <input className="retro-input font-mono text-sm" {...bind("gtmContainerId")} placeholder="GTM-ABC1234" autoComplete="off" spellCheck={false} />
                </Row>
              </div>
            </details>

            <h4 className="set-subhead">Event per tombol</h4>
            <p className="set-row-hint">
              Setiap klik tombol selalu tercatat di Google Analytics/GTM sebagai{" "}
              <code>button_click</code>. Pilih event di bawah kalau klik tombol itu juga mau dikirim
              ke Meta, ChatGPT Ads, TikTok, dan Google Ads sebagai konversi.
            </p>
            <div className="set-rows">
              <div className="set-row set-row--stacked py-1">
                <ButtonEventsEditor
                  json={settings.buttonEventsJson}
                  onChange={(buttonEventsJson) => set("buttonEventsJson", buttonEventsJson)}
                />
                {err("buttonEventsJson")?.length ? (
                  <p role="alert" className="set-row-error pb-3">
                    {err("buttonEventsJson")!.join(" ")}
                  </p>
                ) : null}
              </div>
            </div>

            <details className="set-more mt-6">
              <summary>Nama event di tiap platform</summary>
              <div className="set-more-body overflow-x-auto">
                <table className="w-full min-w-[38rem] text-left text-xs">
                  <thead className="text-black/55">
                    <tr>
                      <th className="py-2 pr-3 font-bold">Event</th>
                      <th className="py-2 pr-3 font-bold">Meta</th>
                      <th className="py-2 pr-3 font-bold">ChatGPT Ads</th>
                      <th className="py-2 pr-3 font-bold">Google</th>
                      <th className="py-2 font-bold">TikTok</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {(
                      [
                        ["Buka halaman", "PageView", "page_viewed", "page_view", "PageView"],
                        ["Brief terkirim", "Lead", "lead_created", "generate_lead", "SubmitForm"],
                        ["Klik tombol apa pun", "–", "–", "button_click", "–"],
                        ["Lead", "Lead", "lead_created", "generate_lead", "SubmitForm"],
                        ["Contact", "Contact", "contact_whatsapp / contact_…", "contact", "Contact"],
                        ["ViewContent", "ViewContent", "contents_viewed", "select_content", "ViewContent"],
                        ["Schedule", "Schedule", "appointment_scheduled", "schedule", "Schedule"],
                        ["FindLocation", "FindLocation", "find_location", "find_location", "FindLocation"],
                        ["Event custom", "nama custom", "nama custom", "nama custom", "nama custom"],
                      ] as const
                    ).map(([event, ...names]) => (
                      <tr key={event} className="border-t border-black/10">
                        <td className="py-2 pr-3 font-sans font-bold">{event}</td>
                        {names.map((n, i) => (
                          <td key={i} className="py-2 pr-3">
                            {n}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-black/50">
                  Di GTM, tiap event juga dikirim sebagai Custom Event <code>ellavera_…</code>, mis.{" "}
                  <code>ellavera_click</code>, <code>ellavera_lead</code>, <code>ellavera_contact</code>,
                  dengan variabel <code>button_id</code> dan <code>button_label</code>.
                </p>
              </div>
            </details>
          </>
        ) : null}
      </div>

      {footer}
    </section>
  );
}
