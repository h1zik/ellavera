#!/bin/bash
set -euo pipefail
# EllaVera DB migration — isolated from mibchemicals (postgres DB) and other services.
WORKDIR="/tmp/ellavera-migrate-$$"
mkdir -p "$WORKDIR"
trap 'rm -rf "$WORKDIR"' EXIT

CLOUD_URL="postgresql://postgres.ykaxxnsnlimpqhzvvsrz:acumalaka1193@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
DB_NAME="ellavera"
DUMP_FILE="$WORKDIR/ellavera.sql"

echo "==> [1/6] Create database $DB_NAME (skip if exists)"
docker exec supabase-db psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 \
  || docker exec supabase-db psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER postgres;"

echo "==> [2/6] Dump schema + data from cloud Supabase (pg17 client, plain SQL)"
docker run --rm postgres:17 pg_dump "$CLOUD_URL" \
  --format=plain \
  --clean --if-exists \
  --no-owner --no-acl \
  --table='public."Section"' \
  --table='public."Content"' \
  --table='public."SiteSettings"' \
  --table='public."Lead"' \
  > "$DUMP_FILE"

echo "==> [3/6] Restore into $DB_NAME"
docker exec -i supabase-db psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$DUMP_FILE"

echo "==> [4/6] Verify row counts"
docker exec supabase-db psql -U postgres -d "$DB_NAME" -c "
SELECT 'Section' AS t, COUNT(*) FROM \"Section\"
UNION ALL SELECT 'Content', COUNT(*) FROM \"Content\"
UNION ALL SELECT 'SiteSettings', COUNT(*) FROM \"SiteSettings\"
UNION ALL SELECT 'Lead', COUNT(*) FROM \"Lead\";
"

echo "==> [5/6] Create storage bucket uploads (public) if missing"
docker exec supabase-db psql -U postgres -d postgres -c "
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'uploads', 'uploads', true, 52428800, NULL
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'uploads');
"

echo "==> [6/6] Done. Database $DB_NAME ready."
echo "Connection: postgresql://postgres:***@46.250.228.110:5432/$DB_NAME"
