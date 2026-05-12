"use client";

import { Content, Lead, Section, SectionType, SiteSettings } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { ContentBlockEditor } from "@/components/admin/content-block-editor";
import { TalentGalleryEditor } from "@/components/admin/talent-gallery-editor";
import { LeadFormFieldsEditor } from "@/components/admin/lead-form-fields-editor";
import { defaultKindForSection, defaultValueForKind } from "@/lib/admin-content-kinds";
import type { LeadFormField } from "@/lib/lead-form-config";
import {
  DEFAULT_LEAD_FORM_FIELDS_JSON,
  getLeadCellValue,
  safeParseLeadFormFieldsJson,
} from "@/lib/lead-form-config";

type SectionWithContents = Section & { contents: Content[] };

type Props = {
  initialSettings: SiteSettings;
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

/** Maps tanpa skema → https://… agar lolos validasi API. */
function normalizeHttpsUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

type ToastState = { message: string; variant: "success" | "error" } | null;

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
    const payload = {
      siteName: settings.siteName,
      tagline: settings.tagline,
      brandPurpose: settings.brandPurpose,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      contactEmail: settings.contactEmail ?? "",
      contactWhatsapp: (settings.contactWhatsapp ?? "").trim(),
      seoTitle: settings.seoTitle ?? "",
      seoDescription: settings.seoDescription ?? "",
      seoKeywords: settings.seoKeywords ?? "",
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
      try {
        const next = (await response.json()) as SiteSettings;
        setSettings(next);
      } catch {
        /* ignore parse */
      }
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
      pushToast("Semua section berhasil disimpan.", "success");
      router.refresh();
    } else {
      pushToast("Gagal menyimpan section. Cek data lalu coba lagi.", "error");
    }
  }

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

  const navBtnClass = (active: boolean) =>
    ["admin-nav-btn", active ? "admin-nav-btn--active" : ""].filter(Boolean).join(" ");

  const sectionNavItems = useMemo(
    () =>
      sortedSections.map((s) => {
        const full = s.name?.trim() || judulTipeSection(s.type);
        const label = full.length > 36 ? `${full.slice(0, 36)}…` : full;
        const view = `section:${s.id}` as AdminView;
        return { view, label, title: full };
      }),
    [sortedSections],
  );

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
    return (
      <div className="retro-item space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-2">
          <p className="text-xs font-black uppercase tracking-widest text-black/50">
            {judulTipeSection(section.type)}
          </p>
          <button
            type="button"
            className="text-xs font-bold uppercase text-red-600 underline"
            onClick={() => deleteSection(section.id, section.name)}
          >
            Hapus section
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <input
            className="retro-input"
            value={section.name}
            onChange={(e) =>
              setSections((prev) =>
                prev.map((it) =>
                  it.id === section.id ? { ...it, name: e.target.value } : it,
                ),
              )
            }
            placeholder="Nama navigasi"
          />
          <input
            className="retro-input"
            value={section.slug}
            onChange={(e) =>
              setSections((prev) =>
                prev.map((it) =>
                  it.id === section.id ? { ...it, slug: e.target.value } : it,
                ),
              )
            }
            placeholder="slug"
          />
          <input
            className="retro-input"
            type="number"
            value={section.order}
            onChange={(e) =>
              setSections((prev) =>
                prev.map((it) =>
                  it.id === section.id ? { ...it, order: Number(e.target.value) } : it,
                ),
              )
            }
            placeholder="Urutan"
          />
          <label className="flex items-center gap-2 font-bold">
            <input
              type="checkbox"
              checked={section.enabled}
              onChange={(e) =>
                setSections((prev) =>
                  prev.map((it) =>
                    it.id === section.id ? { ...it, enabled: e.target.checked } : it,
                  ),
                )
              }
            />
            Tampil
          </label>
        </div>
        <input
          className="retro-input"
          value={section.title ?? ""}
          onChange={(e) =>
            setSections((prev) =>
              prev.map((it) =>
                it.id === section.id ? { ...it, title: e.target.value } : it,
              ),
            )
          }
          placeholder="Judul"
        />
        <input
          className="retro-input"
          value={section.subtitle ?? ""}
          onChange={(e) =>
            setSections((prev) =>
              prev.map((it) =>
                it.id === section.id ? { ...it, subtitle: e.target.value } : it,
              ),
            )
          }
          placeholder="Subtitle (mis. Hero)"
        />
        <textarea
          className="retro-input min-h-[80px]"
          value={section.description ?? ""}
          onChange={(e) =>
            setSections((prev) =>
              prev.map((it) =>
                it.id === section.id ? { ...it, description: e.target.value } : it,
              ),
            )
          }
          placeholder="Deskripsi section"
        />

        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold uppercase">Isi di halaman</p>
              <p className="mt-1 max-w-xl text-xs text-black/55">
                Tambah item (langkah, logo, FAQ, dll.) — form singkat, tanpa kode. Ganti
                &quot;Jenis konten&quot; jika perlu.
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
          {section.contents.map((content, index) => (
            <ContentBlockEditor
              key={content.id}
              sectionType={section.type}
              content={content}
              onPatch={(patch) => patchContent(section.id, index, patch)}
              onRemove={() => removeContentRow(section.id, index)}
            />
          ))}
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
            onClick={() => setActiveView("settings")}
          >
            Pengaturan
          </button>
          <button
            type="button"
            className={`${navBtnClass(activeView === "sections-hub")} shrink-0 whitespace-nowrap lg:w-full lg:whitespace-normal`}
            onClick={() => setActiveView("sections-hub")}
          >
            Section
          </button>
          <div
            className="hidden h-px w-full bg-black/10 lg:my-2 lg:block"
            role="presentation"
          />
          <p className="admin-nav-section-label hidden lg:block">Tiap section</p>
          <div className="flex flex-row gap-1 overflow-x-auto lg:max-h-[min(40vh,22rem)] lg:flex-col lg:overflow-y-auto lg:pr-1">
            {sectionNavItems.map((item) => (
              <button
                key={item.view}
                type="button"
                className={`${navBtnClass(activeView === item.view)} shrink-0 whitespace-nowrap pl-2 text-xs font-semibold text-black/75 lg:w-full lg:whitespace-normal lg:text-left lg:text-sm`}
                title={item.title}
                onClick={() => setActiveView(item.view)}
              >
                {item.label}
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
            onClick={() => setActiveView("leads")}
          >
            Leads ({leads.length})
          </button>
          <button
            type="button"
            className="retro-button-alt mt-2 hidden w-full border-t border-black/10 px-3 pt-3 text-xs font-black lg:block"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              router.push("/admin/login");
              router.refresh();
            }}
          >
            Keluar
          </button>
        </nav>
        <button
          type="button"
          className="retro-button-alt mt-3 w-full px-3 py-2 text-xs font-black lg:hidden"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            router.push("/admin/login");
            router.refresh();
          }}
        >
          Keluar
        </button>
      </aside>

      <div className="min-w-0 min-h-0 flex-1 overflow-y-auto pb-8 [scrollbar-gutter:stable]">
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
        <div className="mt-6 flex flex-col gap-8">
          <div className="admin-form-group space-y-3">
            <h3 className="admin-form-group-title">Identitas & tagline</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="retro-input"
                value={settings.siteName}
                onChange={(e) => setSettings((prev) => ({ ...prev, siteName: e.target.value }))}
                placeholder="Nama situs"
              />
              <input
                className="retro-input"
                value={settings.tagline}
                onChange={(e) => setSettings((prev) => ({ ...prev, tagline: e.target.value }))}
                placeholder="Tagline"
              />
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

          <div className="admin-form-group space-y-3">
            <h3 className="admin-form-group-title">Warna tema</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="font-bold">
                Warna utama (#26CCC2)
                <input
                  type="color"
                  className="mt-1 h-12 w-full cursor-pointer rounded-xl shadow-sm"
                  value={settings.primaryColor}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))
                  }
                />
              </label>
              <label className="font-bold">
                Warna sekunder (#FAE3C7)
                <input
                  type="color"
                  className="mt-1 h-12 w-full cursor-pointer rounded-xl shadow-sm"
                  value={settings.secondaryColor}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))
                  }
                />
              </label>
              <label className="font-bold">
                Aksen (#FFB76C)
                <input
                  type="color"
                  className="mt-1 h-12 w-full cursor-pointer rounded-xl shadow-sm"
                  value={settings.accentColor}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, accentColor: e.target.value }))
                  }
                />
              </label>
            </div>
          </div>

          <div className="admin-form-group space-y-4">
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

          <div className="admin-form-group space-y-4">
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
          </div>

          <div className="admin-form-group space-y-3">
            <h3 className="admin-form-group-title">Kontak di halaman publik</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="retro-input"
                value={settings.contactEmail ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, contactEmail: e.target.value }))
                }
                placeholder="Email kontak"
              />
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
            <textarea
              className="retro-input min-h-[88px]"
              value={settings.locationAddress ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, locationAddress: e.target.value || null }))
              }
              placeholder="Alamat (Contact)"
            />
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

          <div className="admin-form-group space-y-3">
            <h3 className="admin-form-group-title">SEO</h3>
            <input
              className="retro-input"
              value={settings.seoTitle ?? ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, seoTitle: e.target.value }))}
              placeholder="SEO title"
            />
            <textarea
              className="retro-input"
              value={settings.seoDescription ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, seoDescription: e.target.value }))
              }
              placeholder="SEO description"
            />
            <input
              className="retro-input"
              value={settings.seoKeywords ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, seoKeywords: e.target.value }))
              }
              placeholder="SEO keywords"
            />
          </div>

          <div className="admin-form-group space-y-3">
            <h3 className="admin-form-group-title">Brand purpose</h3>
            <textarea
              className="retro-input min-h-[100px]"
              value={settings.brandPurpose}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, brandPurpose: e.target.value }))
              }
              placeholder="Brand purpose"
            />
          </div>
        </div>
        <div className="admin-sticky-actions">
          <div className="admin-sticky-actions-inner">
            <p className="text-xs font-semibold text-black/55 sm:max-w-md">
              Perubahan belum ke server sampai Anda menekan simpan.
            </p>
            <button type="button" className="retro-button shrink-0" onClick={saveSettings}>
              Simpan pengaturan
            </button>
          </div>
        </div>
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

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {sortedSections.length === 0 ? (
            <p className="text-sm font-semibold text-black/55 sm:col-span-2">
              Belum ada section. Tambah lewat &quot;+ Section baru&quot;.
            </p>
          ) : (
            sortedSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className="retro-item flex w-full flex-col items-start gap-2 border-2 border-black/10 p-4 text-left transition hover:border-[var(--brand-primary)] hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]"
                onClick={() => setActiveView(`section:${section.id}`)}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-black/45">
                  {judulTipeSection(section.type)}
                </p>
                <p className="text-lg font-black leading-tight">{section.name}</p>
                <p className="text-xs text-black/50">/{section.slug}</p>
                <span className="mt-1 text-sm font-black text-[var(--brand-primary)]">
                  Edit section →
                </span>
              </button>
            ))
          )}
        </div>
        <button type="button" className="retro-button mt-6" onClick={saveSections}>
          Simpan semua section
        </button>
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  className="retro-button-alt px-4 py-2 text-sm font-black"
                  onClick={() => setActiveView("sections-hub")}
                >
                  ← Daftar section
                </button>
                <p className="text-sm font-bold text-black/60">
                  {section.name} · {judulTipeSection(section.type)}
                </p>
              </div>
              {renderSectionEditor(section)}
              <button type="button" className="retro-button mt-6" onClick={saveSections}>
                Simpan semua section
              </button>
            </>
          );
        })()}
      </section>
        ) : null}

        {activeView === "leads" ? (
      <section className="admin-content-card">
        <h2 className="admin-section-heading">Leads ({leads.length})</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-black/12 bg-white/50 shadow-[4px_4px_0_0_rgba(13,13,13,0.06)]">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
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
              {leads.map((lead, index) => (
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
                      {getLeadCellValue(lead, f.id)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
        ) : null}
      </div>
    </div>
  );
}
