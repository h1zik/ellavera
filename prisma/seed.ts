import { PrismaClient } from "@prisma/client";
import { defaultSections, defaultSettings } from "../src/lib/default-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: defaultSettings,
  });

  const count = await prisma.section.count();
  if (count === 0) {
    for (const section of defaultSections) {
      await prisma.section.create({
        data: {
          slug: section.slug,
          name: section.name,
          type: section.type,
          order: section.order,
          enabled: section.enabled ?? true,
          title: section.title,
          subtitle: section.subtitle,
          description: section.description,
          contents: {
            create: section.contents.map((item) => ({
              key: item.key,
              value: item.value,
              valueType: item.valueType ?? "TEXT",
              sortOrder: item.sortOrder ?? 0,
            })),
          },
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
