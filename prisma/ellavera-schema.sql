-- EllaVera Prisma schema for database ellavera
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "SectionType" AS ENUM ('HERO', 'SERVICES', 'PROCESS', 'WHY_US', 'CLIENT_PORTFOLIO', 'FACTORY_GALLERY', 'TESTIMONIALS', 'EDUCATIONAL', 'FAQ', 'CONTACT');

CREATE TYPE "ContentValueType" AS ENUM ('TEXT', 'MARKDOWN', 'JSON', 'IMAGE_URL', 'URL');

CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueType" "ContentValueType" NOT NULL DEFAULT 'TEXT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'Ellavera',
    "tagline" TEXT NOT NULL DEFAULT 'Maklon kosmetik buat Gen-Z & brand owner — without the drama.',
    "brandPurpose" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#26CCC2',
    "secondaryColor" TEXT NOT NULL DEFAULT '#FAE3C7',
    "accentColor" TEXT NOT NULL DEFAULT '#FFB76C',
    "contactEmail" TEXT,
    "contactWhatsapp" TEXT,
    "locationAddress" TEXT,
    "mapsUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "heroImageUrl" TEXT,
    "adminLogoUrl" TEXT,
    "faviconUrl" TEXT,
    "siteLogoUrl" TEXT,
    "talentGalleryJson" TEXT,
    "leadFormFieldsJson" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "brandName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "responsesJson" TEXT,
    "source" TEXT NOT NULL DEFAULT 'landing-page',
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Section_slug_key" ON "Section"("slug");
CREATE INDEX "Section_enabled_order_idx" ON "Section"("enabled", "order");
CREATE INDEX "Content_sectionId_sortOrder_idx" ON "Content"("sectionId", "sortOrder");
CREATE UNIQUE INDEX "Content_sectionId_key_sortOrder_key" ON "Content"("sectionId", "key", "sortOrder");
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

ALTER TABLE "Content" ADD CONSTRAINT "Content_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
