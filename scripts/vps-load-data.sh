#!/bin/bash
set -euo pipefail
CLOUD='postgresql://postgres.ykaxxnsnlimpqhzvvsrz:acumalaka1193@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
WORKDIR=/tmp/ellavera-migrate
mkdir -p "$WORKDIR"
: > "$WORKDIR/data.sql"
for T in Section Content SiteSettings Lead; do
  docker run --rm postgres:17 pg_dump "$CLOUD" \
    --data-only --column-inserts --no-owner --no-acl \
    --table="public.\"$T\"" >> "$WORKDIR/data.sql"
done
sed -i '/^\\restrict/d;/^\\unrestrict/d;/transaction_timeout/d' "$WORKDIR/data.sql"
docker exec supabase-db psql -U postgres -d ellavera -c 'TRUNCATE "Content", "Section", "SiteSettings", "Lead" CASCADE'
docker exec -i supabase-db psql -U postgres -d ellavera -v ON_ERROR_STOP=1 < "$WORKDIR/data.sql"
docker exec supabase-db psql -U postgres -d postgres -c "
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'uploads', 'uploads', true, 52428800, NULL
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'uploads');
"
docker exec supabase-db psql -U postgres -d ellavera -c "
SELECT 'Section' AS t, COUNT(*) FROM \"Section\"
UNION ALL SELECT 'Content', COUNT(*) FROM \"Content\"
UNION ALL SELECT 'SiteSettings', COUNT(*) FROM \"SiteSettings\"
UNION ALL SELECT 'Lead', COUNT(*) FROM \"Lead\";
"
echo DONE
