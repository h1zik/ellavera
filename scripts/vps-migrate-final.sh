#!/bin/bash
set -euo pipefail

CLOUD='postgresql://postgres.ykaxxnsnlimpqhzvvsrz:acumalaka1193@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
WORKDIR=/tmp/ellavera-migrate
DB=ellavera

mkdir -p "$WORKDIR"

echo '==> [1] Create database'
docker exec supabase-db psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='$DB'" | grep -q 1 \
  || docker exec supabase-db psql -U postgres -c "CREATE DATABASE $DB OWNER postgres;"

echo '==> [2] Apply schema'
docker exec -i supabase-db psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 < /tmp/ellavera-schema.sql

echo '==> [3] Dump data from cloud'
TABLES=('Section' 'Content' 'SiteSettings' 'Lead')
: > "$WORKDIR/data.sql"
for T in "${TABLES[@]}"; do
  docker run --rm postgres:17 pg_dump "$CLOUD" \
    --data-only --column-inserts --no-owner --no-acl \
    --table="public.\"$T\"" >> "$WORKDIR/data.sql"
done
# Strip pg17-only psql meta / settings not supported on PG15
sed -i '/^\\restrict/d;/^\\unrestrict/d;/transaction_timeout/d' "$WORKDIR/data.sql" || true

echo '==> [4] Load data'
docker exec -i supabase-db psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 < "$WORKDIR/data.sql"

echo '==> [5] Storage bucket'
docker exec supabase-db psql -U postgres -d postgres -c "
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'uploads', 'uploads', true, 52428800, NULL
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'uploads');
"

echo '==> [6] Verify'
docker exec supabase-db psql -U postgres -d "$DB" -c "
SELECT 'Section' AS t, COUNT(*) FROM \"Section\"
UNION ALL SELECT 'Content', COUNT(*) FROM \"Content\"
UNION ALL SELECT 'SiteSettings', COUNT(*) FROM \"SiteSettings\"
UNION ALL SELECT 'Lead', COUNT(*) FROM \"Lead\";
"

rm -rf "$WORKDIR"
echo '==> Done'
