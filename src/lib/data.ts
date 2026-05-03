import type { Content, Lead, Section, SiteSettings } from "@prisma/client";
import { Prisma, SectionType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { defaultSettings } from "@/lib/default-data";
import { syncDefaultSectionsFromDefaults } from "@/lib/sync-default-sections";
import { LandingData } from "@/lib/types";

/** Pakai `revalidateTag(LANDING_CACHE_TAG)` setelah ubah settings/section dari API admin. */
export const LANDING_CACHE_TAG = "landing";

/** Pakai `revalidateTag(ADMIN_PAGE_CACHE_TAG)` setelah perubahan data yang tampil di dashboard admin. */
export const ADMIN_PAGE_CACHE_TAG = "admin-page";

export type AdminPageData = {
  settings: SiteSettings;
  sections: (Section & { contents: Content[] })[];
  leads: Lead[];
};

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

/** Panggil `ensureSeedData()` dulu (mis. dari `getAdminPageData`). */
export async function getAllSectionsForAdmin() {
  return prisma.section.findMany({
    orderBy: { order: "asc" },
    include: { contents: { orderBy: { sortOrder: "asc" } } },
  });
}

const getAdminPageDataCached = unstable_cache(
  async (): Promise<AdminPageData> => {
    await ensureSeedData();
    const [settings, sections, leads] = await Promise.all([
      prisma.siteSettings.findUniqueOrThrow({ where: { id: "default" } }),
      getAllSectionsForAdmin(),
      prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
    ]);
    return { settings, sections, leads };
  },
  ["admin-page-v1"],
  { tags: [ADMIN_PAGE_CACHE_TAG], revalidate: 120 },
);

/** Satu round-trip cache untuk halaman admin (hindari query berulang tiap navigasi). */
export async function getAdminPageData(): Promise<AdminPageData> {
  return getAdminPageDataCached();
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
