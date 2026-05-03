import { PrismaClient } from "@prisma/client";
import { syncDefaultSectionsFromDefaults } from "../src/lib/sync-default-sections";
import { defaultSettings } from "../src/lib/default-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: defaultSettings,
  });

  await syncDefaultSectionsFromDefaults({ force: true });
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
