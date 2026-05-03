import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Same resolution as prisma.config.ts — avoids localhost from missing DATABASE_URL on CI. */
function resolvedDatabaseUrl(): string | undefined {
  const u =
    process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_DATABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL?.trim();
  return u || undefined;
}

const dbUrl = resolvedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
