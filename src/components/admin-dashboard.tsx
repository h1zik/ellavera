"use client";

import { Content, Lead, Section, SectionType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminSiteSettings } from "@/lib/admin-settings";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { ContentBlockEditor } from "@/components/admin/content-block-editor";
import { ClientShowcaseEditor } from "@/components/admin/client-showcase-editor";
import { TalentGalleryEditor } from "@/components/admin/talent-gallery-editor";
import { LeadFormFieldsEditor } from "@/components/admin/lead-form-fields-editor";
import { defaultKindForSection, defaultValueForKind } from "@/lib/admin-content-kinds";
import { toWhatsAppHref } from "@/lib/contact-links";
import type { LeadFormField } from "@/lib/lead-form-config";
import {
  DEFAULT_LEAD_FORM_FIELDS_JSON,
  getLeadCellValue,
  safeParseLeadFormFieldsJson,
} from "@/lib/lead-form-config";

type SectionWithContents = Section & { contents: Content[] };

type Props = {
  initialSettings: AdminSiteSettings;
  initialSections: SectionWithContents[];
  leads: Lead[];
};

const SECTION_TYPE_OPTIONS: SectionType[] = [
  SectionType.HERO,
  SectionType.SERVICES,
  SectionType.PROCESS,
  SectionType.WHY_US,
  SectionType.CLIENT_PORTFOLIO,
  SectionType.FACTORY_GALLERY,
  SectionType.TESTIMONIALS,
  SectionType.EDUCATIONAL,
  SectionType.FAQ,
  SectionType.CONTACT,
];

const SETTINGS_GROUPS = [
  { id: "set-identitas", label: "Identitas" },
  { id: "set-warna", label: "Warna" },
  { id: "set-gambar", label: "Gambar & ikon" },
  { id: "set-leads", label: "Form & email leads" },
  { id: "set-kontak", label: "Kontak" },
  { id: "set-seo", label: "SEO" },
  { id: "set-tracking", label: "Pixel" },
  { id: "set-purpose", label: "Brand purpose" },
] as const;

/** Maps tanpa skema → https://… agar lolos validasi API. */
function normalizeHttpsUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

type ToastState = { message: string; variant: "success" | "error" } | null;

/** Representasi stabil data section yang dikirim ke server (abaikan id/timestamp konten). */
function sectionFingerprint(s: SectionWithContents): string {
  return JSON.stringify([
    s.name,
    s.slug,
    s.enabled,
    s.order,
    s.title ?? "",
    s.subtitle ?? "",
    s.description ?? "",
    s.contents.map((c) => [c.key, c.value, c.valueType, c.sortOrder]),
  ]);
}

/** Snapshot per section id — section baru/terhapus cukup ditambah/dibuang dari peta. */
function snapshotSections(list: SectionWithContents[]): Record<string, string> {
  return Object.fromEntries(list.map((s) => [s.id, sectionFingerprint(s)]));
}

function csvCell(value: string): string {
  return /[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Hex 6 digit (#RRGGBB) — format yang diterima input warna & API. */
function isHexColor(v: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(v);
}

/** Satu layar: pengaturan, hub section, satu section, atau leads. */
type AdminView = "settings" | "sections-hub" | "leads" | `section:${string}`;

function isSectionView(v: AdminView): v is `section:${string}` {
  return v.startsWith("section:");
}

function judulTipeSection(t: SectionType): string {
  const map: Record<SectionType, string> = {
    [SectionType.HERO]: "Hero (pembuka halaman)",
    [SectionType.SERVICES]: "Layanan",
    [SectionType.PROCESS]: "Alur / langkah",
    [SectionType.WHY_US]: "Kenapa kami",
    [SectionType.CLIENT_PORTFOLIO]: "Logo klien / portofolio",
    [SectionType.FACTORY_GALLERY]: "Galeri pabrik / lokasi",
    [SectionType.TESTIMONIALS]: "Testimoni",
    [SectionType.EDUCATIONAL]: "Artikel / edukasi",
    [SectionType.FAQ]: "FAQ",
    [SectionType.CONTACT]: "Kontak",
  };
  return map[t] ?? t;
}

function CharCount({ value, ideal }: { value: string; ideal: number }) {
  const over = value.length > ideal;
  return (
    <span className={over ? "font-bold text-amber-700" : "font-medium text-black/45"}>
      {value.length}/{ideal}
      {over ? " — bisa terpotong" : ""}
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
    <div className="space-y-1.5 rounded-xl border-2 border-black/10 bg-white/70 p-3">
      <p className="text-sm font-bold">{label}</p>
      <p className="text-xs text-black/55">{usage}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} — pilih warna`}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border-2 border-black/15 bg-white p-0.5"
          value={isHexColor(value) ? value : defaultValue}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="retro-input py-2 font-mono text-sm uppercase"
          aria-label={`${label} — kode hex`}
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
      {value.toLowerCase() !== defaultValue.toLowerCase() ? (
        <button
          type="button"
          className="text-[11px] font-bold text-black/55 underline"
          onClick={() => onChange(defaultValue)}
        >
          Kembalikan ke {defaultValue}
        </button>
      ) : null}
    </div>
  );
}

function emptyContentRow(
  sectionId: string,
  sortOrder: number,
  sectionType: SectionType,
): Content {
  const dk = defaultKindForSection(sectionType);
  const now = new Date();
  return {
    id: `temp-${crypto.randomUUID()}`,
    sectionId,
    key: dk.key,
    value: defaultValueForKind(dk.key, dk.valueType),
    valueType: dk.valueType,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

export function AdminDashboard({ initialSettings, initialSections, leads }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [sections, setSections] = useState(initialSections);
  const [toast, setToast] = useState<ToastState>(null);
  /** Password SMTP tidak pernah dikirim ke browser; kosong = biarkan yang tersimpan. */
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpPasswordClear, setSmtpPasswordClear] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingSections, setSavingSections] = useState(false);
  /** Snapshot terakhir yang tersimpan di server — pembanding untuk indikator "belum disimpan". */
  const [savedSettingsJson, setSavedSettingsJson] = useState(() =>
    JSON.stringify(initialSettings),
  );
  const [savedSections, setSavedSections] = useState(() => snapshotSections(initialSections));
  const settingsDirty =
    JSON.stringify(settings) !== savedSettingsJson || smtpPassword !== "" || smtpPasswordClear;
  /** Id section yang berubah sejak terakhir disimpan. */
  const dirtySectionIds = useMemo(
    () =>
      new Set(
        sections.filter((s) => savedSections[s.id] !== sectionFingerprint(s)).map((s) => s.id),
      ),
    [sections, savedSections],
  );
  const sectionsDirty = dirtySectionIds.size > 0;
  const [leadQuery, setLeadQuery] = useState("");

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5500);
    return () => window.clearTimeout(id);
  }, [toast]);

  function pushToast(message: string, variant: "success" | "error" = "success") {
    setToast({ message, variant });
  }
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<{
    name: string;
    slug: string;
    type: SectionType;
    order: number;
    title: string;
    subtitle: string;
    description: string;
  }>({
    name: "",
    slug: "",
    type: SectionType.SERVICES,
    order: 1,
    title: "",
    subtitle: "",
    description: "",
  });

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections],
  );

  const leadFormFieldsForTable = useMemo((): LeadFormField[] => {
    const r = safeParseLeadFormFieldsJson(settings.leadFormFieldsJson);
    return r.success
      ? r.data
      : (JSON.parse(DEFAULT_LEAD_FORM_FIELDS_JSON) as LeadFormField[]);
  }, [settings.leadFormFieldsJson]);

  const maxOrder = useMemo(
    () => sortedSections.reduce((m, s) => Math.max(m, s.order), 0),
    [sortedSections],
  );

  const [activeView, setActiveView] = useState<AdminView>("sections-hub");

  useEffect(() => {
    if (!isSectionView(activeView)) return;
    const id = activeView.slice("section:".length);
    if (!sections.some((s) => s.id === id)) {
      setActiveView("sections-hub");
    }
  }, [sections, activeView]);

  async function saveSettings() {
    if (savingSettings) return;
    setSavingSettings(true);
    try {
      await saveSettingsRequest();
    } catch {
      pushToast("Tidak bisa menghubungi server. Cek koneksi lalu simpan lagi.", "error");
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveSettingsRequest() {
    const payload = {
      siteName: settings.siteName,
      tagline: settings.tagline,
      headerEyebrow: settings.headerEyebrow ?? "",
      heroKicker: settings.heroKicker ?? "",
      brandPurpose: settings.brandPurpose,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      contactEmail: settings.contactEmail ?? "",
      contactWhatsapp: (settings.contactWhatsapp ?? "").trim(),
      leadNotifyEmail: (settings.leadNotifyEmail ?? "").trim(),
      smtpHost: (settings.smtpHost ?? "").trim(),
      smtpPort: settings.smtpPort == null ? "" : String(settings.smtpPort),
      smtpSecure:
        settings.smtpSecure == null ? "auto" : settings.smtpSecure ? "true" : "false",
      smtpUser: (settings.smtpUser ?? "").trim(),
      smtpFrom: (settings.smtpFrom ?? "").trim(),
      smtpPassword: smtpPasswordClear ? "" : smtpPassword,
      smtpPasswordClear,
      seoTitle: settings.seoTitle ?? "",
      seoDescription: settings.seoDescription ?? "",
      seoKeywords: settings.seoKeywords ?? "",
      metaPixelId: settings.metaPixelId ?? "",
      heroImageUrl: settings.heroImageUrl ?? "",
      adminLogoUrl: settings.adminLogoUrl ?? "",
      faviconUrl: settings.faviconUrl ?? "",
      siteLogoUrl: settings.siteLogoUrl ?? "",
      talentGalleryJson: settings.talentGalleryJson ?? "",
      leadFormFieldsJson: settings.leadFormFieldsJson ?? "",
      locationAddress: settings.locationAddress ?? "",
      mapsUrl: normalizeHttpsUrl(settings.mapsUrl ?? ""),
    };

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      let next = settings;
      try {
        next = (await response.json()) as AdminSiteSettings;
        setSettings(next);
      } catch {
        /* ignore parse */
      }
      setSavedSettingsJson(JSON.stringify(next));
      setSmtpPassword("");
      setSmtpPasswordClear(false);
      pushToast("Pengaturan berhasil disimpan.", "success");
      router.refresh();
      return;
    }

    let detail = "Gagal menyimpan pengaturan.";
    try {
      const err = (await response.json()) as {
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
        error?: string;
      };
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        detail = Object.entries(err.fieldErrors)
          .map(([k, v]) => `${k}: ${v?.join(", ")}`)
          .join(" · ");
      } else if (err.formErrors?.length) {
        detail = err.formErrors.join(" · ");
      } else if (err.error) {
        detail = err.error;
      }
    } catch {
      /* ignore */
    }
    pushToast(detail, "error");
  }

  async function saveSections() {
    if (savingSections) return;
    setSavingSections(true);
    try {
      await saveSectionsRequest();
    } catch {
      pushToast("Tidak bisa menghubungi server. Cek koneksi lalu simpan lagi.", "error");
    } finally {
      setSavingSections(false);
    }
  }

  async function saveSectionsRequest() {
    const snapshot = snapshotSections(sections);
    const response = await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sections: sortedSections.map((section) => ({
          ...section,
          title: section.title ?? "",
          subtitle: section.subtitle ?? "",
          description: section.description ?? "",
          contents: section.contents.map((c) => ({
            key: c.key,
            value: c.value,
            valueType: c.valueType,
            sortOrder: c.sortOrder,
          })),
        })),
      }),
    });
    if (response.ok) {
      setSavedSections(snapshot);
      pushToast("Section tersimpan dan sudah tampil di situs.", "success");
      router.refresh();
    } else {
      pushToast(
        "Section belum tersimpan. Pastikan nama & slug tiap section minimal 2 karakter, lalu simpan lagi.",
        "error",
      );
    }
  }

  // Ctrl/Cmd+S menyimpan layar yang sedang dibuka.
  const saveShortcutRef = useRef<() => void>(() => {});
  saveShortcutRef.current = () => {
    if (activeView === "settings") void saveSettings();
    else if (activeView === "sections-hub" || isSectionView(activeView)) void saveSections();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveShortcutRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cegah perubahan hilang saat tab ditutup / di-refresh.
  const anyDirty = settingsDirty || sectionsDirty;
  useEffect(() => {
    if (!anyDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyDirty]);

  async function createSection() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          slug: createForm.slug.trim().toLowerCase(),
          type: createForm.type,
          order: createForm.order,
          title: createForm.title.trim() || undefined,
          subtitle: createForm.subtitle.trim() || undefined,
          description: createForm.description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast(data?.error || "Gagal membuat section.", "error");
        return;
      }
      const created = data as SectionWithContents;
      setSections((prev) => [...prev, created]);
      setSavedSections((prev) => ({ ...prev, [created.id]: sectionFingerprint(created) }));
      setActiveView(`section:${created.id}`);
      pushToast("Section baru dibuat. Silakan edit lalu simpan.", "success");
      setShowCreate(false);
      setCreateForm({
        name: "",
        slug: "",
        type: SectionType.SERVICES,
        order: maxOrder + 1,
        title: "",
        subtitle: "",
        description: "",
      });
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function deleteSection(id: string, name: string) {
    if (!confirm(`Hapus section "${name}"? Konten ikut terhapus.`)) {
      return;
    }
    const res = await fetch(`/api/admin/sections/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (res.ok) {
      setSections((prev) => prev.filter((s) => s.id !== id));
      setSavedSections((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setActiveView((v) => (v === `section:${id}` ? "sections-hub" : v));
      pushToast("Section berhasil dihapus.", "success");
      router.refresh();
    } else {
      pushToast("Gagal menghapus section.", "error");
    }
  }

  function addContentRow(section: SectionWithContents) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== section.id) {
          return s;
        }
        const maxSort = s.contents.reduce((m, c) => Math.max(m, c.sortOrder), 0);
        return {
          ...s,
          contents: [...s.contents, emptyContentRow(section.id, maxSort + 1, section.type)],
        };
      }),
    );
  }

  function patchContent(sectionId: string, index: number, patch: Partial<Content>) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) {
          return s;
        }
        return {
          ...s,
          contents: s.contents.map((c, i) => (i === index ? { ...c, ...patch } : c)),
        };
      }),
    );
  }

  function removeContentRow(sectionId: string, index: number) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) {
          return s;
        }
        return {
          ...s,
          contents: s.contents.filter((_, i) => i !== index),
        };
      }),
    );
  }

  function patchSection(sectionId: string, patch: Partial<SectionWithContents>) {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)));
  }

  /** Tukar posisi item lalu nomori ulang sortOrder sesuai urutan tampilan. */
  function moveContentRow(sectionId: string, index: number, direction: -1 | 1) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const target = index + direction;
        if (target < 0 || target >= s.contents.length) return s;
        const contents = [...s.contents];
        [contents[index], contents[target]] = [contents[target], contents[index]];
        return { ...s, contents: contents.map((c, i) => ({ ...c, sortOrder: i + 1 })) };
      }),
    );
  }

  /** Satu-satunya item "showcase" di section portofolio — dibuat/diubah/dihapus dari panel khusus. */
  function setShowcaseUrl(section: SectionWithContents, url: string) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== section.id) return s;
        const others = s.contents.filter((c) => c.key !== "showcase");
        if (!url) return { ...s, contents: others };
        const existing = s.contents.find((c) => c.key === "showcase");
        const now = new Date();
        const row: Content = existing
          ? { ...existing, value: url }
          : {
              id: `temp-${crypto.randomUUID()}`,
              sectionId: s.id,
              key: "showcase",
              value: url,
              valueType: "IMAGE_URL",
              sortOrder: 0,
              createdAt: now,
              updatedAt: now,
            };
        return { ...s, contents: [row, ...others] };
      }),
    );
  }

  const navBtnClass = (active: boolean) =>
    ["admin-nav-btn", active ? "admin-nav-btn--active" : ""].filter(Boolean).join(" ");

  const sectionNavItems = useMemo(
    () =>
      sortedSections.map((s) => {
        const full = s.name?.trim() || judulTipeSection(s.type);
        const label = full.length > 36 ? `${full.slice(0, 36)}…` : full;
        const view = `section:${s.id}` as AdminView;
        return {
          view,
          label,
          title: s.enabled ? full : `${full} (disembunyikan)`,
          enabled: s.enabled,
          dirty: dirtySectionIds.has(s.id),
        };
      }),
    [sortedSections, dirtySectionIds],
  );

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) =>
      leadFormFieldsForTable.some((f) => getLeadCellValue(lead, f.id).toLowerCase().includes(q)),
    );
  }, [leads, leadQuery, leadFormFieldsForTable]);

  function exportLeadsCsv() {
    const header = ["Waktu", ...leadFormFieldsForTable.map((f) => f.label)];
    const rows = filteredLeads.map((lead) => [
      new Date(lead.createdAt).toLocaleString("id-ID"),
      ...leadFormFieldsForTable.map((f) => getLeadCellValue(lead, f.id)),
    ]);
    // BOM supaya Excel membaca UTF-8 (nama dengan aksen/emoji) dengan benar.
    const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `leads-ellavera-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function renderLeadCell(lead: Lead, field: LeadFormField) {
    const value = getLeadCellValue(lead, field.id);
    if (!value) return <span className="text-black/30">—</span>;
    if (field.type === "email") {
      return (
        <a className="font-semibold underline" href={`mailto:${value}`}>
          {value}
        </a>
      );
    }
    if (field.type === "tel") {
      return (
        <a
          className="font-semibold underline"
          href={toWhatsAppHref(value)}
          target="_blank"
          rel="noopener noreferrer"
          title="Buka chat WhatsApp"
        >
          {value}
        </a>
      );
    }
    return <span className="whitespace-pre-line">{value}</span>;
  }

  function goTo(view: AdminView) {
    setActiveView(view);
    // Di HP konten ada di bawah menu — bawa ke atas supaya layar baru langsung terlihat.
    if (window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function logout() {
    if (anyDirty && !confirm("Ada perubahan yang belum disimpan. Tetap keluar?")) return;
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const adminContext = useMemo(() => {
    if (activeView === "settings") {
      return {
        title: "Pengaturan situs",
        subtitle: "Brand, SEO, kontak, form leads",
      };
    }
    if (activeView === "sections-hub") {
      return {
        title: "Section halaman",
        subtitle: `${sortedSections.length} section`,
      };
    }
    if (activeView === "leads") {
      return { title: "Leads", subtitle: `${leads.length} kiriman` };
    }
    if (isSectionView(activeView)) {
      const sid = activeView.slice("section:".length);
      const s = sortedSections.find((x) => x.id === sid);
      return s
        ? { title: s.name, subtitle: judulTipeSection(s.type) }
        : { title: "Section", subtitle: "" };
    }
    return { title: "", subtitle: "" };
  }, [activeView, sortedSections, leads.length]);

  function renderSectionEditor(section: SectionWithContents) {
    const isPortfolio = section.type === SectionType.CLIENT_PORTFOLIO;
    // Item "showcase" punya panel sendiri — jangan tampil lagi di daftar item biasa.
    const listed = section.contents
      .map((content, index) => ({ content, index }))
      .filter(({ content }) => !(isPortfolio && content.key === "showcase"));
    const showcaseUrl = section.contents.find((c) => c.key === "showcase")?.value ?? "";
    const legacyLogoCount = section.contents.filter((c) => c.key === "brand").length;

    return (
      <div className="space-y-6">
        <div className="admin-form-group space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="admin-form-group-title">Info section</h3>
            <label className="admin-switch">
              <input
                type="checkbox"
                checked={section.enabled}
                onChange={(e) => patchSection(section.id, { enabled: e.target.checked })}
              />
              <span className="admin-switch-track" aria-hidden />
              <span className="text-sm font-bold">
                {section.enabled ? "Tampil di situs" : "Disembunyikan"}
              </span>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-[2fr_2fr_1fr]">
            <label className="admin-label">
              Nama di menu
              <input
                className="retro-input mt-1"
                value={section.name}
                onChange={(e) => patchSection(section.id, { name: e.target.value })}
                placeholder="Contoh: Layanan"
              />
            </label>
            <label className="admin-label">
              Alamat anchor (slug)
              <span className="mt-1 flex items-center">
                <span className="admin-input-prefix">#</span>
                <input
                  className="retro-input rounded-l-none"
                  value={section.slug}
                  onChange={(e) =>
                    patchSection(section.id, { slug: e.target.value.toLowerCase() })
                  }
                  placeholder="layanan"
                />
              </span>
            </label>
            <label className="admin-label">
              Urutan
              <input
                className="retro-input mt-1"
                type="number"
                value={section.order}
                onChange={(e) => patchSection(section.id, { order: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="admin-label">
            Judul
            <input
              className="retro-input mt-1"
              value={section.title ?? ""}
              onChange={(e) => patchSection(section.id, { title: e.target.value })}
              placeholder="Judul besar section"
            />
          </label>
          {section.type === SectionType.HERO ? (
            <label className="admin-label">
              Label kecil di atas judul
              <input
                className="retro-input mt-1"
                value={section.subtitle ?? ""}
                onChange={(e) => patchSection(section.id, { subtitle: e.target.value })}
                placeholder="Contoh: Ellavera"
              />
            </label>
          ) : null}
          <label className="admin-label">
            Deskripsi
            <textarea
              className="retro-input mt-1 min-h-[88px]"
              value={section.description ?? ""}
              onChange={(e) => patchSection(section.id, { description: e.target.value })}
              placeholder="Satu-dua kalimat di bawah judul (opsional)"
            />
          </label>
        </div>

        {isPortfolio ? (
          <ClientShowcaseEditor
            url={showcaseUrl}
            onChange={(url) => setShowcaseUrl(section, url)}
            legacyLogoCount={legacyLogoCount}
          />
        ) : null}

        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="admin-form-group-title">
                {isPortfolio ? "Logo satuan (cadangan)" : "Isi section"}
              </h3>
              <p className="mt-1 max-w-xl text-xs text-black/55">
                {isPortfolio
                  ? "Hanya tampil selama gambar logo klien di atas masih kosong."
                  : "Urutan di sini = urutan di halaman. Pakai tombol ↑ ↓ untuk memindah."}
              </p>
            </div>
            <button
              type="button"
              className="retro-button-alt px-3 py-1.5 text-xs"
              onClick={() => addContentRow(section)}
            >
              + Tambah item
            </button>
          </div>
          {listed.length === 0 ? (
            <p className="admin-empty">
              Belum ada item. Klik &quot;+ Tambah item&quot; untuk mulai mengisi.
            </p>
          ) : (
            listed.map(({ content, index }, i) => (
              <ContentBlockEditor
                key={content.id}
                sectionType={section.type}
                content={content}
                position={i + 1}
                total={listed.length}
                onPatch={(patch) => patchContent(section.id, index, patch)}
                onRemove={() => removeContentRow(section.id, index)}
                onMove={(dir) => {
                  const neighbour = listed[i + dir];
                  if (neighbour) moveContentRow(section.id, index, (neighbour.index - index) as -1 | 1);
                }}
              />
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-black/10 pt-4">
          <a
            href={`/#${section.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold underline decoration-[var(--brand-primary)] decoration-2 underline-offset-4"
          >
            Lihat section ini di situs
          </a>
          <button
            type="button"
            className="text-xs font-bold text-red-700 underline"
            onClick={() => deleteSection(section.id, section.name)}
          >
            Hapus section
          </button>
        </div>
      </div>
    );
  }

  function renderSaveBar(opts: {
    dirty: boolean;
    saving: boolean;
    label: string;
    onSave: () => void;
  }) {
    return (
      <div className="admin-sticky-actions">
        <div className="admin-sticky-actions-inner">
          <p
            className={[
              "flex items-center gap-2 text-xs font-semibold sm:max-w-md",
              opts.dirty ? "text-[var(--retro-black)]" : "text-black/50",
            ].join(" ")}
            aria-live="polite"
          >
            <span
              className={["admin-dot", opts.dirty ? "admin-dot--dirty" : ""].join(" ")}
              aria-hidden
            />
            {opts.dirty
              ? "Ada perubahan yang belum disimpan."
              : "Semua perubahan sudah tersimpan."}
            <kbd className="admin-kbd hidden sm:inline">Ctrl+S</kbd>
          </p>
          <button
            type="button"
            className="retro-button shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={opts.onSave}
            disabled={opts.saving}
          >
            {opts.saving ? "Menyimpan…" : opts.label}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {toast ? (
        <div
          role="alert"
          className={[
            "fixed left-1/2 top-4 z-[200] flex w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-3 rounded-2xl border-[3px] px-4 py-3",
            toast.variant === "success" ? "admin-toast-success" : "admin-toast-error",
          ].join(" ")}
        >
          <p className="flex-1 text-sm font-black leading-snug">{toast.message}</p>
          <button
            type="button"
            className="shrink-0 rounded-lg border-2 border-black/20 bg-white/80 px-2 py-0.5 text-xs font-black hover:bg-white"
            onClick={() => setToast(null)}
            aria-label="Tutup pemberitahuan"
          >
            OK
          </button>
        </div>
      ) : null}

      <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-[15.5rem] lg:self-start">
        <nav
          className="admin-sidebar-shell flex flex-row gap-1 overflow-x-auto p-3 lg:flex-col lg:gap-0 lg:overflow-visible"
          aria-label="Navigasi panel admin"
        >
          <p className="admin-nav-section-label hidden lg:block">Menu</p>
          <button
            type="button"
            className={`${navBtnClass(activeView === "settings")} shrink-0 whitespace-nowrap lg:w-full lg:whitespace-normal`}
            aria-current={activeView === "settings" ? "page" : undefined}
            onClick={() => goTo("settings")}
          >
            <span className="flex items-center justify-between gap-2">
              Pengaturan
              {settingsDirty ? (
                <span className="admin-dot admin-dot--dirty" title="Belum disimpan" />
              ) : null}
            </span>
          </button>
          <button
            type="button"
            className={`${navBtnClass(activeView === "sections-hub")} shrink-0 whitespace-nowrap lg:w-full lg:whitespace-normal`}
            aria-current={activeView === "sections-hub" ? "page" : undefined}
            onClick={() => goTo("sections-hub")}
          >
            Semua section
          </button>
          <div
            className="hidden h-px w-full bg-black/10 lg:my-2 lg:block"
            role="presentation"
          />
          <p className="admin-nav-section-label hidden lg:block">Tiap section</p>
          <div className="flex flex-row gap-1 overflow-x-auto lg:max-h-[min(44vh,24rem)] lg:flex-col lg:overflow-y-auto lg:pr-1">
            {sectionNavItems.map((item) => (
              <button
                key={item.view}
                type="button"
                className={`${navBtnClass(activeView === item.view)} shrink-0 whitespace-nowrap pl-2 text-xs font-semibold text-black/75 lg:w-full lg:whitespace-normal lg:text-left lg:text-sm`}
                title={item.title}
                aria-current={activeView === item.view ? "page" : undefined}
                onClick={() => goTo(item.view)}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={item.enabled ? "" : "text-black/40 line-through"}>
                    {item.label}
                  </span>
                  {item.dirty ? (
                    <span className="admin-dot admin-dot--dirty" title="Belum disimpan" />
                  ) : null}
                </span>
              </button>
            ))}
          </div>
          <div
            className="mx-1 hidden h-px w-full bg-black/10 lg:my-2 lg:block"
            role="presentation"
          />
          <button
            type="button"
            className={`${navBtnClass(activeView === "leads")} shrink-0 whitespace-nowrap lg:w-full lg:whitespace-normal`}
            aria-current={activeView === "leads" ? "page" : undefined}
            onClick={() => goTo("leads")}
          >
            <span className="flex items-center justify-between gap-2">
              Leads
              <span className="admin-count">{leads.length}</span>
            </span>
          </button>
          <div className="mt-3 hidden flex-col gap-2 border-t border-black/10 pt-3 lg:flex">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-nav-btn text-center"
            >
              Lihat situs
            </a>
            <button
              type="button"
              className="retro-button-alt w-full px-3 py-2 text-xs font-black"
              onClick={logout}
            >
              Keluar
            </button>
          </div>
        </nav>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:hidden">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="retro-button-alt px-3 py-2 text-xs font-black"
          >
            Lihat situs
          </a>
          <button
            type="button"
            className="retro-button-alt px-3 py-2 text-xs font-black"
            onClick={logout}
          >
            Keluar
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-8">
        <div className="admin-context-bar" role="status" aria-live="polite">
          <span className="admin-context-bar-label">Anda di</span>
          <span className="admin-context-bar-value">{adminContext.title}</span>
          {adminContext.subtitle ? (
            <span className="ml-auto hidden max-w-[min(100%,20rem)] truncate text-xs font-semibold text-black/50 sm:inline">
              {adminContext.subtitle}
            </span>
          ) : null}
        </div>
        {activeView === "settings" ? (
      <section className="admin-content-card">
        <h2 className="admin-section-heading">Pengaturan situs</h2>
        <p className="mt-2 max-w-2xl text-sm text-black/65">
          Ubah per blok, lalu simpan — data baru tampil di beranda setelah berhasil disimpan.
        </p>
        <nav className="admin-jump" aria-label="Lompat ke grup pengaturan">
          {SETTINGS_GROUPS.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="admin-jump-link">
              {g.label}
            </a>
          ))}
        </nav>
        <div className="mt-6 flex flex-col gap-8">
          <div id="set-identitas" className="admin-form-group scroll-mt-6 space-y-3">
            <h3 className="admin-form-group-title">Identitas & tagline</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="admin-label">
                Nama situs
                <input
                  className="retro-input mt-1"
                  value={settings.siteName}
                  onChange={(e) => setSettings((prev) => ({ ...prev, siteName: e.target.value }))}
                  placeholder="Ellavera"
                />
              </label>
              <label className="admin-label">
                Tagline (di bawah logo header)
                <input
                  className="retro-input mt-1"
                  value={settings.tagline}
                  onChange={(e) => setSettings((prev) => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Maklon kosmetik buat Gen-Z & brand owner"
                />
              </label>
            </div>
            <div className="space-y-3 rounded-xl border-2 border-black/10 bg-white/60 p-4">
              <div>
                <p className="text-sm font-bold">Teks kecil (eyebrow)</p>
                <p className="text-xs font-semibold text-black/55">
                  Baris huruf kapital kecil di atas logo header & di atas judul hero. Kosongkan
                  kalau mau disembunyikan.
                </p>
              </div>
              <label className="block text-xs font-bold text-black/70">
                Header beranda (di atas logo)
                <input
                  className="retro-input mt-1"
                  value={settings.headerEyebrow ?? ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, headerEyebrow: e.target.value }))
                  }
                  placeholder="Maklon · Gen-Z · Unisex"
                  maxLength={120}
                />
              </label>
              <label className="block text-xs font-bold text-black/70">
                Hero (di atas judul besar)
                <input
                  className="retro-input mt-1"
                  value={settings.heroKicker ?? ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, heroKicker: e.target.value }))
                  }
                  placeholder="Retro · Playful · High-energy"
                  maxLength={120}
                />
              </label>
            </div>
            <div className="space-y-2 rounded-xl border-2 border-black/10 bg-white/60 p-4">
              <p className="text-sm font-bold">Logo header beranda</p>
              <p className="text-xs font-semibold text-black/55">
                Jika diisi, teks nama situs di atas halaman diganti logo ini (teks nama tetap dipakai
                untuk alt & SEO).
              </p>
              <input
                className="retro-input"
                value={settings.siteLogoUrl ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, siteLogoUrl: e.target.value }))
                }
                placeholder="URL logo (atau upload)"
              />
              <ImageUploadField
                label="Upload logo beranda"
                currentUrl={settings.siteLogoUrl ?? ""}
                onUrlChange={(url) =>
                  setSettings((prev) => ({ ...prev, siteLogoUrl: url }))
                }
              />
            </div>
          </div>

          <div id="set-warna" className="admin-form-group scroll-mt-6 space-y-3">
            <h3 className="admin-form-group-title">Warna tema</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["primaryColor", "Warna utama", "Tombol, bayangan kartu", "#26CCC2"],
                  ["secondaryColor", "Warna sekunder", "Latar kartu section", "#FAE3C7"],
                  ["accentColor", "Aksen", "Tombol kedua, sorotan", "#FFB76C"],
                ] as const
              ).map(([key, label, usage, fallback]) => (
                <ColorField
                  key={key}
                  label={label}
                  usage={usage}
                  defaultValue={fallback}
                  value={settings[key]}
                  onChange={(v) => setSettings((prev) => ({ ...prev, [key]: v }))}
                />
              ))}
            </div>
          </div>

          <div id="set-gambar" className="admin-form-group scroll-mt-6 space-y-4">
            <h3 className="admin-form-group-title">Gambar & ikon</h3>
            <div className="space-y-2 rounded-xl border-2 border-black/10 bg-white/60 p-4">
              <p className="text-sm font-bold">Gambar hero</p>
              <input
                className="retro-input"
                value={settings.heroImageUrl ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, heroImageUrl: e.target.value }))
                }
                placeholder="URL gambar hero (atau upload di bawah)"
              />
              <ImageUploadField
                label="Upload gambar hero"
                currentUrl={settings.heroImageUrl ?? ""}
                onUrlChange={(url) =>
                  setSettings((prev) => ({ ...prev, heroImageUrl: url }))
                }
              />
            </div>
            <div className="space-y-2 rounded-xl border-2 border-black/10 bg-white/60 p-4">
              <p className="text-sm font-bold">Logo halaman login admin</p>
              <input
                className="retro-input"
                value={settings.adminLogoUrl ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, adminLogoUrl: e.target.value }))
                }
                placeholder="URL logo (atau upload)"
              />
              <ImageUploadField
                label="Upload logo admin"
                currentUrl={settings.adminLogoUrl ?? ""}
                onUrlChange={(url) =>
                  setSettings((prev) => ({ ...prev, adminLogoUrl: url }))
                }
              />
            </div>
            <div className="space-y-2 rounded-xl border-2 border-black/10 bg-white/60 p-4">
              <p className="text-sm font-bold">Favicon situs</p>
              <p className="text-xs font-semibold text-black/55">
                Tampil di tab browser. Format .ico, .png, atau .svg (URL penuh).
              </p>
              <input
                className="retro-input"
                value={settings.faviconUrl ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, faviconUrl: e.target.value }))
                }
                placeholder="URL favicon"
              />
              <ImageUploadField
                label="Upload favicon"
                currentUrl={settings.faviconUrl ?? ""}
                onUrlChange={(url) =>
                  setSettings((prev) => ({ ...prev, faviconUrl: url }))
                }
              />
            </div>
          </div>

          <div id="set-leads" className="admin-form-group scroll-mt-6 space-y-4">
            <h3 className="admin-form-group-title">Galeri & form leads</h3>
            <TalentGalleryEditor
              json={settings.talentGalleryJson}
              onChange={(talentGalleryJson) =>
                setSettings((prev) => ({ ...prev, talentGalleryJson }))
              }
            />
            <LeadFormFieldsEditor
              json={settings.leadFormFieldsJson}
              onChange={(leadFormFieldsJson) =>
                setSettings((prev) => ({ ...prev, leadFormFieldsJson }))
              }
            />
            <div className="space-y-2 rounded-xl border-2 border-black/10 bg-white/60 p-4">
              <p className="text-sm font-bold">Email penerima notifikasi lead</p>
              <p className="text-xs font-semibold text-black/55">
                Setiap kali ada yang submit form, isinya dikirim ke alamat ini. Boleh lebih dari
                satu — pisahkan dengan koma. Kalau dikosongkan, dipakai “Email kontak” di blok
                Kontak.
              </p>
              <input
                className="retro-input"
                value={settings.leadNotifyEmail ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, leadNotifyEmail: e.target.value }))
                }
                placeholder="sales@ellavera.id, owner@ellavera.id"
                inputMode="email"
                autoComplete="email"
              />
              <p className="text-xs font-semibold text-black/45">
                Lead tetap tersimpan di tab Leads walau email gagal terkirim.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border-2 border-black/10 bg-white/60 p-4">
              <div>
                <p className="text-sm font-bold">Server pengirim (SMTP)</p>
                <p className="text-xs font-semibold text-black/55">
                  Akun email yang dipakai untuk mengirim notifikasi. Gmail/Google Workspace:
                  host <code>smtp.gmail.com</code>, port <code>587</code>, password pakai{" "}
                  <strong>App Password</strong> 16 karakter (bukan password login). Kalau blok ini
                  dikosongkan, sistem memakai konfigurasi SMTP dari environment server (kalau ada).
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-xs font-bold text-black/70">
                  Host SMTP
                  <input
                    className="retro-input mt-1 font-normal"
                    value={settings.smtpHost ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, smtpHost: e.target.value }))
                    }
                    placeholder="smtp.gmail.com"
                    autoComplete="off"
                  />
                </label>
                <label className="block text-xs font-bold text-black/70">
                  Port
                  <input
                    className="retro-input mt-1 font-normal"
                    value={settings.smtpPort == null ? "" : String(settings.smtpPort)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setSettings((prev) => ({
                        ...prev,
                        smtpPort: raw ? Number.parseInt(raw, 10) : null,
                      }));
                    }}
                    placeholder="587"
                    inputMode="numeric"
                  />
                </label>
                <label className="block text-xs font-bold text-black/70">
                  Username
                  <input
                    className="retro-input mt-1 font-normal"
                    value={settings.smtpUser ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, smtpUser: e.target.value }))
                    }
                    placeholder="akun@gmail.com"
                    autoComplete="off"
                  />
                </label>
                <label className="block text-xs font-bold text-black/70">
                  Koneksi aman (SSL/TLS)
                  <select
                    className="retro-input mt-1 font-normal"
                    value={
                      settings.smtpSecure == null ? "auto" : settings.smtpSecure ? "true" : "false"
                    }
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        smtpSecure:
                          e.target.value === "auto" ? null : e.target.value === "true",
                      }))
                    }
                  >
                    <option value="auto">Otomatis (SSL kalau port 465)</option>
                    <option value="true">Selalu SSL (port 465)</option>
                    <option value="false">STARTTLS (port 587)</option>
                  </select>
                </label>
              </div>
              <label className="block text-xs font-bold text-black/70">
                Password / App Password
                <input
                  type="password"
                  className="retro-input mt-1 font-normal"
                  value={smtpPassword}
                  onChange={(e) => {
                    setSmtpPassword(e.target.value);
                    if (e.target.value) setSmtpPasswordClear(false);
                  }}
                  placeholder={
                    settings.smtpPasswordSet
                      ? "•••••••••••• (tersimpan — isi hanya kalau mau ganti)"
                      : "Belum diisi"
                  }
                  autoComplete="new-password"
                  disabled={smtpPasswordClear}
                />
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-black/55">
                  <span>
                    Status:{" "}
                    {settings.smtpPasswordSet ? "tersimpan" : "belum diisi"} ·{" "}
                    {settings.smtpPasswordEncrypted
                      ? "terenkripsi di database"
                      : "belum terenkripsi (set SMTP_CRYPT_KEY di server)"}
                  </span>
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
                      Hapus password saat simpan
                    </label>
                  ) : null}
                </span>
              </label>
              <label className="block text-xs font-bold text-black/70">
                Alamat pengirim (From)
                <input
                  className="retro-input mt-1 font-normal"
                  value={settings.smtpFrom ?? ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, smtpFrom: e.target.value }))
                  }
                  placeholder='Ellavera Website <no-reply@ellavera.id>'
                />
                <span className="mt-1 block text-xs font-semibold text-black/55">
                  Kosong = pakai username di atas. Banyak provider menolak alamat pengirim yang
                  berbeda dari akun SMTP.
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-3 border-t-2 border-dashed border-black/10 pt-3">
                <button
                  type="button"
                  className="retro-button-alt px-4 py-2 text-xs font-black disabled:opacity-60"
                  disabled={testingEmail}
                  onClick={async () => {
                    setTestingEmail(true);
                    try {
                      const res = await fetch("/api/admin/test-email", {
                        method: "POST",
                        credentials: "same-origin",
                      });
                      const data = (await res.json()) as { ok?: boolean; message?: string };
                      pushToast(
                        data.message || (res.ok ? "Email tes terkirim." : "Gagal kirim email tes."),
                        res.ok ? "success" : "error",
                      );
                    } catch {
                      pushToast("Gagal menghubungi server.", "error");
                    } finally {
                      setTestingEmail(false);
                    }
                  }}
                >
                  {testingEmail ? "Mengirim…" : "Kirim email tes"}
                </button>
                <span className="text-xs font-semibold text-black/55">
                  Simpan dulu, baru tes — tombol ini memakai data yang sudah tersimpan.
                </span>
              </div>
            </div>
          </div>

          <div id="set-kontak" className="admin-form-group scroll-mt-6 space-y-3">
            <h3 className="admin-form-group-title">Kontak di halaman publik</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="admin-label">
                Email kontak
                <input
                  className="retro-input mt-1 font-normal"
                  type="email"
                  value={settings.contactEmail ?? ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, contactEmail: e.target.value }))
                  }
                  placeholder="halo@ellavera.id"
                />
              </label>
              <label className="font-bold">
                Nomor WhatsApp (tampil di halaman kontak)
                <input
                  className="retro-input mt-1 font-normal"
                  value={settings.contactWhatsapp ?? ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, contactWhatsapp: e.target.value }))
                  }
                  placeholder="+6281234567890 atau 081234567890"
                  inputMode="tel"
                  autoComplete="tel"
                />
                <span className="mt-1 block text-xs font-semibold text-black/55">
                  Boleh pakai +62, 08…, atau spasi; link wa.me dibuat otomatis.
                </span>
              </label>
            </div>
            <label className="admin-label">
              Alamat kantor / pabrik
              <textarea
                className="retro-input mt-1 min-h-[88px] font-normal"
                value={settings.locationAddress ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, locationAddress: e.target.value || null }))
                }
                placeholder="Jl. …, Kota, Provinsi"
              />
            </label>
            <label className="font-bold">
              Link Google Maps (tombol di section kontak)
              <input
                className="retro-input mt-1 font-normal"
                value={settings.mapsUrl ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, mapsUrl: e.target.value || null }))
                }
                placeholder="https://maps.google.com/... atau maps.app.goo.gl/..."
                inputMode="url"
              />
              <span className="mt-1 block text-xs font-semibold text-black/55">
                Tempel URL lengkap; kalau tanpa https:// akan ditambahkan otomatis saat simpan.
              </span>
            </label>
          </div>

          <div id="set-seo" className="admin-form-group scroll-mt-6 space-y-3">
            <h3 className="admin-form-group-title">SEO</h3>
            <label className="admin-label">
              <span className="flex justify-between gap-2">
                Judul di Google & tab browser
                <CharCount value={settings.seoTitle ?? ""} ideal={60} />
              </span>
              <input
                className="retro-input mt-1 font-normal"
                value={settings.seoTitle ?? ""}
                onChange={(e) => setSettings((prev) => ({ ...prev, seoTitle: e.target.value }))}
                placeholder="Ellavera | Maklon kosmetik Gen-Z"
              />
            </label>
            <label className="admin-label">
              <span className="flex justify-between gap-2">
                Deskripsi di hasil pencarian
                <CharCount value={settings.seoDescription ?? ""} ideal={160} />
              </span>
              <textarea
                className="retro-input mt-1 min-h-[80px] font-normal"
                value={settings.seoDescription ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, seoDescription: e.target.value }))
                }
                placeholder="Satu-dua kalimat yang menjelaskan Ellavera"
              />
            </label>
            <label className="admin-label">
              Kata kunci (pisahkan dengan koma)
              <input
                className="retro-input mt-1 font-normal"
                value={settings.seoKeywords ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, seoKeywords: e.target.value }))
                }
                placeholder="maklon kosmetik, private label, skincare"
              />
            </label>
          </div>

          <div id="set-tracking" className="admin-form-group scroll-mt-6 space-y-3">
            <h3 className="admin-form-group-title">Tracking &amp; iklan</h3>
            <label className="font-bold">
              Meta (Facebook) Pixel ID
              <input
                className="retro-input mt-1 font-normal"
                value={settings.metaPixelId ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, metaPixelId: e.target.value }))
                }
                placeholder="contoh: 1234567890123456"
                inputMode="numeric"
              />
              <span className="mt-1 block text-xs font-semibold text-black/55">
                Tempel ID Pixel dari Meta Events Manager (hanya angka, ~15-16 digit). Kosongkan untuk
                mematikan pixel. Saat diisi, pixel + event PageView, Lead (kirim brief), dan Contact
                (klik WhatsApp) otomatis aktif.
              </span>
            </label>
          </div>

          <div id="set-purpose" className="admin-form-group scroll-mt-6 space-y-3">
            <h3 className="admin-form-group-title">Brand purpose</h3>
            <label className="admin-label">
              Teks kecil di footer
              <textarea
                className="retro-input mt-1 min-h-[100px] font-normal"
                value={settings.brandPurpose}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, brandPurpose: e.target.value }))
                }
                placeholder="Misi singkat Ellavera"
              />
            </label>
          </div>
        </div>
        {renderSaveBar({
          dirty: settingsDirty,
          saving: savingSettings,
          label: "Simpan pengaturan",
          onSave: saveSettings,
        })}
      </section>
        ) : null}

        {activeView === "sections-hub" ? (
      <section className="admin-content-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="admin-section-heading">Section halaman</h2>
            <p className="mt-2 text-sm text-black/70">
              Pilih section di sidebar atau di bawah untuk mengedit isinya. Buat section baru di
              sini.
            </p>
          </div>
          <button
            type="button"
            className="retro-button-alt shrink-0 px-4 py-2 text-sm"
            onClick={() => {
              setShowCreate((v) => !v);
              setCreateForm((f) => ({ ...f, order: maxOrder + 1 }));
            }}
          >
            {showCreate ? "Tutup form" : "+ Section baru"}
          </button>
        </div>

        {showCreate ? (
          <div className="mt-4 space-y-3 rounded-xl border-2 border-dashed border-black/25 bg-white/70 p-4">
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="retro-input"
                placeholder="Nama (nav)"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className="retro-input"
                placeholder="slug-url (huruf kecil, dash)"
                value={createForm.slug}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))
                }
              />
              <select
                className="retro-input"
                value={createForm.type}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, type: e.target.value as SectionType }))
                }
              >
                {SECTION_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {judulTipeSection(t)}
                  </option>
                ))}
              </select>
              <input
                className="retro-input"
                type="number"
                placeholder="Urutan"
                value={createForm.order}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, order: Number(e.target.value) }))
                }
              />
              <input
                className="retro-input md:col-span-2"
                placeholder="Judul section (opsional)"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              />
              <input
                className="retro-input md:col-span-2"
                placeholder="Subtitle (hero, opsional)"
                value={createForm.subtitle}
                onChange={(e) => setCreateForm((f) => ({ ...f, subtitle: e.target.value }))}
              />
              <textarea
                className="retro-input md:col-span-2 min-h-[72px]"
                placeholder="Deskripsi (opsional)"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <button
              type="button"
              className="retro-button text-sm"
              disabled={creating || !createForm.name.trim() || !createForm.slug.trim()}
              onClick={createSection}
            >
              {creating ? "Membuat…" : "Buat section"}
            </button>
          </div>
        ) : null}

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {sortedSections.length === 0 ? (
            <li className="admin-empty sm:col-span-2">
              Belum ada section. Klik &quot;+ Section baru&quot; untuk membuat yang pertama.
            </li>
          ) : (
            sortedSections.map((section) => {
              const itemCount = section.contents.length;
              const dirty = dirtySectionIds.has(section.id);
              return (
                <li key={section.id} className="admin-hub-card">
                  <button
                    type="button"
                    className="flex w-full flex-col items-start gap-1.5 p-4 text-left"
                    onClick={() => goTo(`section:${section.id}`)}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-xs font-bold text-black/50">
                        {section.order}. {judulTipeSection(section.type)}
                      </span>
                      {dirty ? (
                        <span className="admin-dot admin-dot--dirty" title="Belum disimpan" />
                      ) : null}
                    </span>
                    <span className="text-lg font-black leading-tight">{section.name}</span>
                    <span className="text-xs text-black/50">
                      #{section.slug} · {itemCount} item
                    </span>
                  </button>
                  <label className="admin-switch border-t border-black/10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(e) => patchSection(section.id, { enabled: e.target.checked })}
                    />
                    <span className="admin-switch-track" aria-hidden />
                    <span className="text-xs font-bold">
                      {section.enabled ? "Tampil" : "Disembunyikan"}
                    </span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
        {renderSaveBar({
          dirty: sectionsDirty,
          saving: savingSections,
          label: "Simpan semua section",
          onSave: saveSections,
        })}
      </section>
        ) : null}

        {isSectionView(activeView) ? (
      <section className="admin-content-card">
        {(() => {
          const sid = activeView.slice("section:".length);
          const section = sortedSections.find((s) => s.id === sid);
          if (!section) {
            return (
              <p className="text-sm text-black/60">
                Section tidak ditemukan. Kembali ke daftar Section.
              </p>
            );
          }
          return (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <button
                    type="button"
                    className="text-sm font-bold text-black/55 underline underline-offset-4 hover:text-black"
                    onClick={() => goTo("sections-hub")}
                  >
                    ← Semua section
                  </button>
                  <h2 className="admin-section-heading mt-2 border-b-0 pb-0">{section.name}</h2>
                  <p className="text-sm font-semibold text-black/55">
                    {judulTipeSection(section.type)}
                  </p>
                </div>
              </div>
              {renderSectionEditor(section)}
              {renderSaveBar({
                dirty: sectionsDirty,
                saving: savingSections,
                label: "Simpan section",
                onSave: saveSections,
              })}
            </>
          );
        })()}
      </section>
        ) : null}

        {activeView === "leads" ? (
      <section className="admin-content-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="admin-section-heading border-b-0 pb-0">Leads</h2>
            <p className="mt-1 text-sm text-black/60">
              {filteredLeads.length === leads.length
                ? `${leads.length} kiriman terbaru dari form kontak.`
                : `${filteredLeads.length} dari ${leads.length} kiriman cocok.`}
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <input
              type="search"
              className="retro-input py-2 text-sm sm:w-64"
              placeholder="Cari nama, email, nomor…"
              aria-label="Cari leads"
              value={leadQuery}
              onChange={(e) => setLeadQuery(e.target.value)}
            />
            <button
              type="button"
              className="retro-button-alt px-4 py-2 text-xs"
              onClick={exportLeadsCsv}
              disabled={filteredLeads.length === 0}
            >
              Unduh CSV
            </button>
          </div>
        </div>
        {leads.length === 0 ? (
          <p className="admin-empty mt-6">
            Belum ada lead. Kiriman dari form &quot;Kirim brief&quot; di situs akan muncul di sini.
          </p>
        ) : (
          <div className="mt-6 max-h-[70vh] overflow-auto rounded-2xl border-2 border-black/12 bg-white/50 shadow-[4px_4px_0_0_rgba(13,13,13,0.06)]">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b-2 border-[var(--retro-black)] bg-[color-mix(in_srgb,var(--brand-primary)_88%,white)]">
                  <th className="p-3.5 font-black whitespace-nowrap text-[var(--retro-black)]">
                    Waktu
                  </th>
                  {leadFormFieldsForTable.map((f) => (
                    <th key={f.id} className="p-3.5 font-black text-[var(--retro-black)]">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={
                      index % 2 === 0
                        ? "bg-white/60 transition hover:bg-white/90"
                        : "bg-[color-mix(in_srgb,var(--brand-secondary)_35%,white)] transition hover:bg-white/95"
                    }
                  >
                    <td className="p-3 align-top whitespace-nowrap text-xs font-semibold text-black/70">
                      {new Date(lead.createdAt).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    {leadFormFieldsForTable.map((f) => (
                      <td key={f.id} className="p-3 align-top">
                        {renderLeadCell(lead, f)}
                      </td>
                    ))}
                  </tr>
                ))}
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={leadFormFieldsForTable.length + 1}
                      className="p-6 text-center text-sm text-black/55"
                    >
                      Tidak ada lead yang cocok dengan &quot;{leadQuery}&quot;.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
        ) : null}
      </div>
    </div>
  );
}
