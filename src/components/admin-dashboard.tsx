"use client";

import { Content, Lead, Section, SectionType, SiteSettings } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { ContentBlockEditor } from "@/components/admin/content-block-editor";
import { TalentGalleryEditor } from "@/components/admin/talent-gallery-editor";
import { defaultKindForSection, defaultValueForKind } from "@/lib/admin-content-kinds";

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
  const [message, setMessage] = useState("");
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

  const maxOrder = useMemo(
    () => sortedSections.reduce((m, s) => Math.max(m, s.order), 0),
    [sortedSections],
  );

  async function saveSettings() {
    const payload = {
      siteName: settings.siteName,
      tagline: settings.tagline,
      brandPurpose: settings.brandPurpose,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      contactEmail: settings.contactEmail ?? "",
      contactWhatsapp: settings.contactWhatsapp ?? "",
      seoTitle: settings.seoTitle ?? "",
      seoDescription: settings.seoDescription ?? "",
      seoKeywords: settings.seoKeywords ?? "",
      heroImageUrl: settings.heroImageUrl ?? "",
      talentGalleryJson: settings.talentGalleryJson ?? "",
      locationAddress: settings.locationAddress ?? "",
      mapsUrl: settings.mapsUrl ?? "",
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
      setMessage("Pengaturan disimpan.");
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
    setMessage(detail);
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
    setMessage(response.ok ? "Section disimpan." : "Gagal menyimpan section.");
    if (response.ok) {
      router.refresh();
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
        setMessage(data?.error || "Gagal membuat section.");
        return;
      }
      setSections((prev) => [...prev, data as SectionWithContents]);
      setMessage("Section baru dibuat — lanjut edit & simpan.");
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
      setMessage("Section dihapus.");
      router.refresh();
    } else {
      setMessage("Gagal menghapus section.");
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

  return (
    <div className="space-y-8">
      <section className="retro-card">
        <h2 className="section-title">Pengaturan situs</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
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
          <label className="font-bold">
            Warna utama (#26CCC2)
            <input
              type="color"
              className="mt-1 h-12 w-full cursor-pointer rounded-xl shadow-sm"
              value={settings.primaryColor}
              onChange={(e) => setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
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
              onChange={(e) => setSettings((prev) => ({ ...prev, accentColor: e.target.value }))}
            />
          </label>
          <div className="md:col-span-2 space-y-2 rounded-xl border-2 border-black/10 bg-white/60 p-4">
            <p className="text-sm font-bold">Gambar hero</p>
            <input
              className="retro-input"
              value={settings.heroImageUrl ?? ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, heroImageUrl: e.target.value }))}
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
          <TalentGalleryEditor
            json={settings.talentGalleryJson}
            onChange={(talentGalleryJson) =>
              setSettings((prev) => ({ ...prev, talentGalleryJson }))
            }
          />
          <input
            className="retro-input"
            value={settings.contactEmail ?? ""}
            onChange={(e) => setSettings((prev) => ({ ...prev, contactEmail: e.target.value }))}
            placeholder="Email kontak"
          />
          <input
            className="retro-input"
            value={settings.contactWhatsapp ?? ""}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, contactWhatsapp: e.target.value }))
            }
            placeholder="WhatsApp"
          />
          <textarea
            className="retro-input md:col-span-2 min-h-[88px]"
            value={settings.locationAddress ?? ""}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, locationAddress: e.target.value || null }))
            }
            placeholder="Alamat (Contact)"
          />
          <input
            className="retro-input md:col-span-2"
            value={settings.mapsUrl ?? ""}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, mapsUrl: e.target.value || null }))
            }
            placeholder="URL Google Maps"
          />
          <input
            className="retro-input md:col-span-2"
            value={settings.seoTitle ?? ""}
            onChange={(e) => setSettings((prev) => ({ ...prev, seoTitle: e.target.value }))}
            placeholder="SEO title"
          />
          <textarea
            className="retro-input md:col-span-2"
            value={settings.seoDescription ?? ""}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, seoDescription: e.target.value }))
            }
            placeholder="SEO description"
          />
          <input
            className="retro-input md:col-span-2"
            value={settings.seoKeywords ?? ""}
            onChange={(e) => setSettings((prev) => ({ ...prev, seoKeywords: e.target.value }))}
            placeholder="SEO keywords"
          />
          <textarea
            className="retro-input md:col-span-2"
            value={settings.brandPurpose}
            onChange={(e) => setSettings((prev) => ({ ...prev, brandPurpose: e.target.value }))}
            placeholder="Brand purpose"
          />
        </div>
        <button type="button" className="retro-button mt-4" onClick={saveSettings}>
          Simpan pengaturan
        </button>
      </section>

      <section className="retro-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title">Section halaman</h2>
            <p className="mt-2 text-sm text-black/70">
              Buat, edit, atau hapus section. Isi tiap section pakai form pendek — tanpa menulis
              kode.
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

        <div className="mt-6 space-y-6">
          {sortedSections.map((section) => (
            <div key={section.id} className="retro-item space-y-3">
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
          ))}
        </div>
        <button type="button" className="retro-button mt-6" onClick={saveSections}>
          Simpan semua section
        </button>
      </section>

      <section className="retro-card">
        <h2 className="section-title">Leads ({leads.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[var(--brand-primary)]">
                <th className="p-3 font-black">Name</th>
                <th className="p-3 font-black">Email</th>
                <th className="p-3 font-black">Brand</th>
                <th className="p-3 font-black">Message</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => (
                <tr
                  key={lead.id}
                  className={index % 2 === 0 ? "bg-white/50" : "bg-white/70"}
                >
                  <td className="p-3 align-top">{lead.fullName}</td>
                  <td className="p-3 align-top">{lead.email}</td>
                  <td className="p-3 align-top">{lead.brandName || "-"}</td>
                  <td className="p-3 align-top">{lead.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {message ? (
        <p className="rounded-lg border-2 border-black/15 bg-white px-4 py-2 font-bold">{message}</p>
      ) : null}
    </div>
  );
}
