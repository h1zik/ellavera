/**
 * Copy EllaVera data — run on VPS (supabase_default network).
 */
import { PrismaClient } from "@prisma/client";

const SRC =
  process.env.SRC_DATABASE_URL ||
  "postgresql://postgres.ykaxxnsnlimpqhzvvsrz:acumalaka1193@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
const DST =
  process.env.DST_DATABASE_URL ||
  "postgresql://postgres:eTFDlw8EK5jyCXi1@db:5432/ellavera";

const src = new PrismaClient({ datasources: { db: { url: SRC } } });
const dst = new PrismaClient({ datasources: { db: { url: DST } } });

const sections = await src.section.findMany({ include: { contents: true } });
const settings = await src.siteSettings.findMany();
const leads = await src.lead.findMany();

console.log(
  `Source: ${sections.length} sections, ${settings.length} settings, ${leads.length} leads`,
);

await dst.$transaction([
  dst.content.deleteMany(),
  dst.section.deleteMany(),
  dst.siteSettings.deleteMany(),
  dst.lead.deleteMany(),
]);

for (const s of sections) {
  const { contents, ...section } = s;
  await dst.section.create({ data: section });
  if (contents.length) await dst.content.createMany({ data: contents });
}
for (const row of settings) await dst.siteSettings.create({ data: row });
for (const row of leads) await dst.lead.create({ data: row });

console.log("Destination:", {
  sections: await dst.section.count(),
  contents: await dst.content.count(),
  settings: await dst.siteSettings.count(),
  leads: await dst.lead.count(),
});

await src.$disconnect();
await dst.$disconnect();
