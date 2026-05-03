import { AdminDashboard } from "@/components/admin-dashboard";
import { ensureSeedData, getAllSectionsForAdmin } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await ensureSeedData();

  const [settings, sections, leads] = await Promise.all([
    prisma.siteSettings.findUniqueOrThrow({ where: { id: "default" } }),
    getAllSectionsForAdmin(),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <main className="min-h-screen space-y-6 bg-[var(--brand-secondary)] p-4 md:p-8">
      <header className="retro-card mx-auto w-full max-w-6xl">
        <h1 className="text-4xl font-black">Ellavera CMS Dashboard</h1>
        <p className="mt-2 text-black/75">
          Atur teks, warna, gambar, urutan section, dan leads — semua lewat form, tanpa kode.
        </p>
      </header>
      <div className="mx-auto w-full max-w-6xl">
        <AdminDashboard
          initialSettings={settings}
          initialSections={sections}
          leads={leads}
        />
      </div>
    </main>
  );
}
