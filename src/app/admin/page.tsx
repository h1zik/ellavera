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
        <header className="admin-top-header relative z-10 flex flex-wrap items-center justify-between gap-4 py-5 md:py-6">
          <div className="relative z-10">
            <h1 className="admin-page-title text-2xl md:text-3xl">{settings.siteName} CMS</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-black/65 md:text-base">
              Atur teks, gambar, urutan section, dan lihat leads yang masuk.
            </p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="retro-button-alt relative z-10 px-4 py-2.5 text-xs"
          >
            Buka situs
          </a>
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
