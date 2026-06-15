/**
 * Rewrite remaining cloud Supabase storage URLs in ellavera DB.
 * Run: node scripts/rewrite-storage-urls.mjs
 */
import { PrismaClient } from "@prisma/client";

const OLD = "https://ykaxxnsnlimpqhzvvsrz.supabase.co/storage/v1/object/public/uploads/";
const NEW = "https://api.mibchemicals.com/storage/v1/object/public/uploads/";

const db = new PrismaClient();

function rewrite(value) {
  if (!value?.includes("ykaxxnsnlimpqhzvvsrz")) return value;
  return value.split(OLD).join(NEW).replaceAll(
    "https://ykaxxnsnlimpqhzvvsrz.supabase.co/",
    "https://api.mibchemicals.com/",
  );
}

const settings = await db.siteSettings.findMany();
for (const s of settings) {
  await db.siteSettings.update({
    where: { id: s.id },
    data: {
      heroImageUrl: rewrite(s.heroImageUrl),
      adminLogoUrl: rewrite(s.adminLogoUrl),
      faviconUrl: rewrite(s.faviconUrl),
      siteLogoUrl: rewrite(s.siteLogoUrl),
      talentGalleryJson: rewrite(s.talentGalleryJson),
    },
  });
}

const contents = await db.content.findMany({
  where: { value: { contains: "ykaxxnsnlimpqhzvvsrz" } },
});
for (const c of contents) {
  await db.content.update({
    where: { id: c.id },
    data: { value: rewrite(c.value) },
  });
}

console.log(`Updated ${settings.length} settings, ${contents.length} content rows`);
await db.$disconnect();
