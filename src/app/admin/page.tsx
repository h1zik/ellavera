import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import { getAdminPageData } from "@/lib/data";

const AdminDashboard = dynamic(
  () => import("@/components/admin-dashboard").then((mod) => mod.AdminDashboard),
  {
    loading: () => (
      <div className="admin-content-card mx-auto flex max-w-6xl items-center justify-center gap-3 py-16 text-sm font-bold text-black/60">
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
        Memuat panel admin…
      </div>
    ),
    ssr: true,
  },
);

export default async function AdminPage() {
  const { settings, sections, leads } = await getAdminPageData();

  const brandStyle = {
    "--brand-primary": settings.primaryColor,
    "--brand-secondary": settings.secondaryColor,
    "--brand-accent": settings.accentColor,
  } as CSSProperties;

  return (
    <main
      style={brandStyle}
      className="admin-app-root min-h-screen bg-[color-mix(in_srgb,var(--brand-secondary)_55%,#faf8f3)] p-4 pb-10 md:p-8"
    >
      <div className="mx-auto w-full max-w-[min(88rem,100%)] space-y-6">
        <header className="admin-top-header relative z-10">
          <p className="admin-eyebrow relative z-10">Panel konten</p>
          <h1 className="admin-page-title relative z-10 mt-4">Ellavera CMS</h1>
          <p className="relative z-10 mt-3 max-w-2xl text-base font-medium leading-relaxed text-black/72 md:text-lg">
            Atur teks, warna, gambar, urutan section, dan leads — semua lewat form, tanpa kode.
          </p>
        </header>
        <div className="w-full">
          <AdminDashboard
            initialSettings={settings}
            initialSections={sections}
            leads={leads}
          />
        </div>
      </div>
    </main>
  );
}
