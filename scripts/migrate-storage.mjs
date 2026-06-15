/**
 * Migrate EllaVera storage objects from cloud Supabase to self-hosted VPS.
 * Run on VPS: node migrate-storage.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SRC_URL = "https://ykaxxnsnlimpqhzvvsrz.supabase.co";
const SRC_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrYXh4bnNubGltcHFoenZ2c3J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc5OTQ1MywiZXhwIjoyMDkzMzc1NDUzfQ.ZRmAKFomRrJaSiEvzbVe039uTMiKGvs9TdQCUGMt3e0";

const DST_URL = "https://api.mibchemicals.com";
const DST_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODE1MDkzMzEsImV4cCI6MTkzOTE4OTMzMX0.Ux7qKmYoEAF5lE2fkjof3TOqiq9Erm5NI1nXQxu9uGA";

const BUCKET = "uploads";

const src = createClient(SRC_URL, SRC_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const dst = createClient(DST_URL, DST_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: objects, error: listErr } = await src.storage.from(BUCKET).list("site", {
  limit: 100,
});
if (listErr) throw listErr;

const files = (objects ?? []).filter((o) => o.name && !o.id?.includes("/"));
console.log(`Found ${files.length} files in ${BUCKET}/site/`);

for (const file of files) {
  const path = `site/${file.name}`;
  const { data: blob, error: dlErr } = await src.storage.from(BUCKET).download(path);
  if (dlErr) {
    console.error(`FAIL download ${path}:`, dlErr.message);
    continue;
  }
  const buf = Buffer.from(await blob.arrayBuffer());
  const { error: upErr } = await dst.storage.from(BUCKET).upload(path, buf, {
    upsert: true,
    contentType: file.metadata?.mimetype ?? undefined,
  });
  if (upErr) {
    console.error(`FAIL upload ${path}:`, upErr.message);
    continue;
  }
  console.log(`OK ${path} (${buf.length} bytes)`);
}

console.log("Storage migration complete.");
