/**
 * Copy EllaVera Prisma tables from cloud Supabase to self-hosted ellavera database.
 * Run: node scripts/migrate-data.mjs
 */
import { PrismaClient } from "@prisma/client";

const SRC = "postgresql://postgres.ykaxxnsnlimpqhzvvsrz:acumalaka1193@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
const DST = "postgresql://postgres:eTFDlw8EK5jyCXi1@46.250.228.110:5432/ellavera";

const src = new PrismaClient({ datasources: { db: { url: SRC } } });
const dst = new PrismaClient({ datasources: { db: { url: DST } } });

async function main() {
  console.log("Pushing schema to destination...");
  // schema should already exist from db push; copy data in FK order
  const sections = await src.section.findMany({ include: { contents: true } });
  const settings = await src.siteSettings.findMany();
  const leads = await src.lead.findMany();

  console.log(`Source: ${sections.length} sections, ${settings.length} settings, ${leads.length} leads`);

  await dst.$transaction([
    dst.content.deleteMany(),
    dst.section.deleteMany(),
    dst.siteSettings.deleteMany(),
    dst.lead.deleteMany(),
  ]);

  for (const s of sections) {
    const { contents, ...section } = s;
    await dst.section.create({ data: section });
    if (contents.length) {
      await dst.content.createMany({ data: contents });
    }
  }

  for (const row of settings) {
    await dst.siteSettings.create({ data: row });
  }

  for (const row of leads) {
    await dst.lead.create({ data: row });
  }

  const verify = {
    sections: await dst.section.count(),
    contents: await dst.content.count(),
    settings: await dst.siteSettings.count(),
    leads: await dst.lead.count(),
  };
  console.log("Destination counts:", verify);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await src.$disconnect();
    await dst.$disconnect();
  });
