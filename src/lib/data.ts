import { Prisma, SectionType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { defaultSettings } from "@/lib/default-data";
import { syncDefaultSectionsFromDefaults } from "@/lib/sync-default-sections";
import { LandingData } from "@/lib/types";

/** Pakai `revalidateTag(LANDING_CACHE_TAG)` setelah ubah settings/section dari API admin. */
export const LANDING_CACHE_TAG = "landing";

export async function ensureSeedData() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    await prisma.siteSettings.create({ data: defaultSettings });
  }

  await syncDefaultSectionsFromDefaults();
}

const getLandingDataCached = unstable_cache(
  async (): Promise<LandingData> => {
    await ensureSeedData();
    const [settings, sections] = await Promise.all([
      prisma.siteSettings.findUniqueOrThrow({ where: { id: "default" } }),
      prisma.section.findMany({
        where: { enabled: true },
        orderBy: { order: "asc" },
        include: { contents: { orderBy: { sortOrder: "asc" } } },
      }),
    ]);
    return { settings, sections };
  },
  ["landing-data-v1"],
  { tags: [LANDING_CACHE_TAG], revalidate: 300 },
);

export async function getLandingData(): Promise<LandingData> {
  return getLandingDataCached();
}

export async function getAllSectionsForAdmin() {
  await ensureSeedData();
  return prisma.section.findMany({
    orderBy: { order: "asc" },
    include: { contents: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function updateSiteSettings(input: Prisma.SiteSettingsUpdateInput) {
  return prisma.siteSettings.update({
    where: { id: "default" },
    data: input,
  });
}

export async function updateSection(
  sectionId: string,
  input: Prisma.SectionUpdateInput,
) {
  return prisma.section.update({
    where: { id: sectionId },
    data: input,
  });
}

export async function getSectionTypeOptions() {
  return Object.values(SectionType);
}
