#!/bin/bash
set -euo pipefail

SITE_DIR="/opt/ellavera-db-prep"
DB_URL="postgresql://postgres:eTFDlw8EK5jyCXi1@db:5432/ellavera"
CLOUD_URL="postgresql://postgres.ykaxxnsnlimpqhzvvsrz:acumalaka1193@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

echo "==> Ensure ellavera database exists"
docker exec supabase-db psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'ellavera'" | grep -q 1 \
  || docker exec supabase-db psql -U postgres -c "CREATE DATABASE ellavera OWNER postgres;"

echo "==> Prisma db push (schema)"
docker run --rm \
  --network supabase_default \
  -v "$SITE_DIR:/app" \
  -w /app \
  -e DATABASE_URL="$DB_URL" \
  -e DIRECT_URL="$DB_URL" \
  node:20-bookworm-slim \
  bash -lc "npm ci --omit=dev && npx prisma db push --accept-data-loss"

echo "==> Copy data cloud -> ellavera"
docker run --rm \
  --network supabase_default \
  -v "$SITE_DIR:/app" \
  -w /app \
  node:20-bookworm-slim \
  bash -lc "npm ci --omit=dev && node scripts/migrate-data-internal.mjs"

echo "==> Create storage bucket uploads"
docker exec supabase-db psql -U postgres -d postgres -c "
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'uploads', 'uploads', true, 52428800, NULL
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'uploads');
"

echo "==> Verify"
docker exec supabase-db psql -U postgres -d ellavera -c "
SELECT 'Section' AS t, COUNT(*) FROM \"Section\"
UNION ALL SELECT 'Content', COUNT(*) FROM \"Content\"
UNION ALL SELECT 'SiteSettings', COUNT(*) FROM \"SiteSettings\"
UNION ALL SELECT 'Lead', COUNT(*) FROM \"Lead\";
"

echo "==> Done"
