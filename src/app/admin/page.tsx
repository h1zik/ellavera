import dynamic from "next/dynamic";
import { getAdminPageData } from "@/lib/data";

const AdminDashboard = dynamic(
  () => import("@/components/admin-dashboard").then((mod) => mod.AdminDashboard),
  {
    loading: () => (
      <div className="retro-card mx-auto flex max-w-6xl items-center justify-center gap-3 py-16 text-sm font-bold text-black/60">
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

  return (
    <main className="min-h-screen bg-[var(--brand-secondary)] p-4 md:p-8">
      <div className="mx-auto w-full max-w-[min(88rem,100%)] space-y-6">
      <header className="retro-card">
        <h1 className="text-4xl font-black">Ellavera CMS Dashboard</h1>
        <p className="mt-2 text-black/75">
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
