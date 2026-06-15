#!/bin/bash
set -euo pipefail
OLD='https://ykaxxnsnlimpqhzvvsrz.supabase.co/storage/v1/object/public/uploads/'
NEW='https://api.mibchemicals.com/storage/v1/object/public/uploads/'

docker exec -i supabase-db psql -U postgres -d ellavera -v ON_ERROR_STOP=1 <<SQL
UPDATE "SiteSettings" SET
  "heroImageUrl" = REPLACE("heroImageUrl", '$OLD', '$NEW'),
  "adminLogoUrl" = REPLACE("adminLogoUrl", '$OLD', '$NEW'),
  "faviconUrl" = REPLACE("faviconUrl", '$OLD', '$NEW'),
  "siteLogoUrl" = REPLACE("siteLogoUrl", '$OLD', '$NEW'),
  "talentGalleryJson" = REPLACE("talentGalleryJson", '$OLD', '$NEW');

UPDATE "Content" SET "value" = REPLACE("value", '$OLD', '$NEW')
WHERE "value" LIKE '%ykaxxnsnlimpqhzvvsrz.supabase.co%';
SQL

echo "URLs rewritten"
