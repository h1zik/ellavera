/**
 * Paksa menyelaraskan section dengan src/lib/default-data.ts (huruf demi huruf).
 * Jalankan: npm run db:sync-sections
 */
import "dotenv/config";
import { syncDefaultSectionsFromDefaults } from "../src/lib/sync-default-sections";

async function main() {
  await syncDefaultSectionsFromDefaults({ force: true });
  console.log("Sections synced from default-data.ts.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
