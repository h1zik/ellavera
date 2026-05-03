import { Prisma, SectionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { defaultSettings } from "@/lib/default-data";
import { syncDefaultSectionsFromDefaults } from "@/lib/sync-default-sections";
import { LandingData } from "@/lib/types";

export async function ensureSeedData() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    await prisma.siteSettings.create({ data: defaultSettings });
  }

  await syncDefaultSectionsFromDefaults();
}

export async function getLandingData(): Promise<LandingData> {
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
