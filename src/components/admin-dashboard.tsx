"use client";

import { Content, Lead, Section, SiteSettings } from "@prisma/client";
import { useMemo, useState } from "react";

type SectionWithContents = Section & { contents: Content[] };

type Props = {
  initialSettings: SiteSettings;
  initialSections: SectionWithContents[];
  leads: Lead[];
};

export function AdminDashboard({ initialSettings, initialSections, leads }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [sections, setSections] = useState(initialSections);
  const [message, setMessage] = useState("");

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections],
  );

  async function saveSettings() {
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setMessage(response.ok ? "Site settings saved." : "Failed saving settings.");
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
        })),
      }),
    });
    setMessage(response.ok ? "Sections updated." : "Failed saving sections.");
  }

  return (
    <div className="space-y-8">
      <section className="retro-card">
        <h2 className="section-title">Site Settings</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            className="retro-input"
            value={settings.siteName}
            onChange={(e) => setSettings((prev) => ({ ...prev, siteName: e.target.value }))}
            placeholder="Site Name"
          />
          <input
            className="retro-input"
            value={settings.tagline}
            onChange={(e) => setSettings((prev) => ({ ...prev, tagline: e.target.value }))}
            placeholder="Tagline"
          />
          <label className="font-bold">
            Primary Color
            <input
              type="color"
              className="mt-1 h-12 w-full rounded-xl border-4 border-black"
              value={settings.primaryColor}
              onChange={(e) => setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
            />
          </label>
          <label className="font-bold">
            Secondary Color
            <input
              type="color"
              className="mt-1 h-12 w-full rounded-xl border-4 border-black"
              value={settings.secondaryColor}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))
              }
            />
          </label>
          <label className="font-bold">
            Accent Color
            <input
              type="color"
              className="mt-1 h-12 w-full rounded-xl border-4 border-black"
              value={settings.accentColor}
              onChange={(e) => setSettings((prev) => ({ ...prev, accentColor: e.target.value }))}
            />
          </label>
          <input
            className="retro-input"
            value={settings.heroImageUrl ?? ""}
            onChange={(e) => setSettings((prev) => ({ ...prev, heroImageUrl: e.target.value }))}
            placeholder="Hero image URL"
          />
          <input
            className="retro-input"
            value={settings.contactEmail ?? ""}
            onChange={(e) => setSettings((prev) => ({ ...prev, contactEmail: e.target.value }))}
            placeholder="Contact email"
          />
          <input
            className="retro-input"
            value={settings.contactWhatsapp ?? ""}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, contactWhatsapp: e.target.value }))
            }
            placeholder="Contact WhatsApp"
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
        <button className="retro-button mt-4" onClick={saveSettings}>
          Save Settings
        </button>
      </section>

      <section className="retro-card">
        <h2 className="section-title">Sections</h2>
        <p className="mt-2 text-sm">Edit title/desc, toggle visibility, and sort order.</p>
        <div className="mt-4 space-y-4">
          {sortedSections.map((section) => (
            <div key={section.id} className="retro-item space-y-3">
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
                  Enabled
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
                placeholder="Section title"
              />
              <textarea
                className="retro-input"
                value={section.description ?? ""}
                onChange={(e) =>
                  setSections((prev) =>
                    prev.map((it) =>
                      it.id === section.id ? { ...it, description: e.target.value } : it,
                    ),
                  )
                }
                placeholder="Section description"
              />
              <div className="space-y-2">
                <p className="text-sm font-bold uppercase">Contents</p>
                {section.contents.map((content, index) => (
                  <div key={content.id} className="grid gap-2 md:grid-cols-4">
                    <input
                      className="retro-input"
                      value={content.key}
                      onChange={(e) =>
                        setSections((prev) =>
                          prev.map((it) =>
                            it.id === section.id
                              ? {
                                  ...it,
                                  contents: it.contents.map((c, i) =>
                                    i === index ? { ...c, key: e.target.value } : c,
                                  ),
                                }
                              : it,
                          ),
                        )
                      }
                    />
                    <input
                      className="retro-input md:col-span-2"
                      value={content.value}
                      onChange={(e) =>
                        setSections((prev) =>
                          prev.map((it) =>
                            it.id === section.id
                              ? {
                                  ...it,
                                  contents: it.contents.map((c, i) =>
                                    i === index ? { ...c, value: e.target.value } : c,
                                  ),
                                }
                              : it,
                          ),
                        )
                      }
                    />
                    <input
                      className="retro-input"
                      type="number"
                      value={content.sortOrder}
                      onChange={(e) =>
                        setSections((prev) =>
                          prev.map((it) =>
                            it.id === section.id
                              ? {
                                  ...it,
                                  contents: it.contents.map((c, i) =>
                                    i === index
                                      ? { ...c, sortOrder: Number(e.target.value) }
                                      : c,
                                  ),
                                }
                              : it,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="retro-button mt-4" onClick={saveSections}>
          Save Sections
        </button>
      </section>

      <section className="retro-card">
        <h2 className="section-title">Leads ({leads.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse border-4 border-black">
            <thead>
              <tr className="bg-[var(--brand-primary)]">
                <th className="border-2 border-black p-2 text-left">Name</th>
                <th className="border-2 border-black p-2 text-left">Email</th>
                <th className="border-2 border-black p-2 text-left">Brand</th>
                <th className="border-2 border-black p-2 text-left">Message</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="border-2 border-black p-2">{lead.fullName}</td>
                  <td className="border-2 border-black p-2">{lead.email}</td>
                  <td className="border-2 border-black p-2">{lead.brandName || "-"}</td>
                  <td className="border-2 border-black p-2">{lead.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {message ? <p className="font-bold">{message}</p> : null}
    </div>
  );
}
