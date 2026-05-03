import { ContentValueType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { defaultSections } from "@/lib/default-data";

/** Section lama yang diganti di layout baru — dihapus saat sinkronisasi. */
const OBSOLETE_SLUGS = ["testimonials", "educational"] as const;

/**
 * Menyelaraskan section & konten dengan `default-data.ts`.
 * Tanpa `force`: hanya jalan jika DB kosong, ada slug baru yang belum ada, atau masih ada section lawas.
 * Dengan `force: true`: selalu upsert semua default (dipakai `db:seed` / `db:sync-sections`).
 */
export async function syncDefaultSectionsFromDefaults(options?: {
  force?: boolean;
}): Promise<boolean> {
  const force = options?.force === true;
  const defaultSlugs = defaultSections.map((s) => s.slug);

  if (!force) {
    const [existing, obsoleteCount, sectionCount] = await Promise.all([
      prisma.section.findMany({ select: { slug: true } }),
      prisma.section.count({ where: { slug: { in: [...OBSOLETE_SLUGS] } } }),
      prisma.section.count(),
    ]);

    const existingSet = new Set(existing.map((e) => e.slug));
    const anyMissing = defaultSlugs.some((slug) => !existingSet.has(slug));

    if (sectionCount > 0 && obsoleteCount === 0 && !anyMissing) {
      return false;
    }
  }

  // Tanpa interactive $transaction: Supabase Transaction pooler (PgBouncer :6543)
  // sering memutus transaksi interaktif (P2028). Operasi berurutan tetap idempoten.
  await prisma.section.deleteMany({
    where: { slug: { in: [...OBSOLETE_SLUGS] } },
  });

  for (const section of defaultSections) {
    const row = await prisma.section.upsert({
      where: { slug: section.slug },
      create: {
        slug: section.slug,
        name: section.name,
        type: section.type,
        order: section.order,
        enabled: section.enabled ?? true,
        title: section.title,
        subtitle: section.subtitle,
        description: section.description,
      },
      update: {
        name: section.name,
        type: section.type,
        order: section.order,
        enabled: section.enabled ?? true,
        title: section.title,
        subtitle: section.subtitle,
        description: section.description,
      },
    });

    await prisma.content.deleteMany({ where: { sectionId: row.id } });
    if (section.contents.length > 0) {
      await prisma.content.createMany({
        data: section.contents.map((item) => ({
          sectionId: row.id,
          key: item.key,
          value: item.value,
          valueType: item.valueType ?? ContentValueType.TEXT,
          sortOrder: item.sortOrder ?? 0,
        })),
      });
    }
  }

  return true;
}
