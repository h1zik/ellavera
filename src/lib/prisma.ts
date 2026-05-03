import { PrismaClient } from "@prisma/client";
import { ensurePrismaDatabaseEnv } from "@/lib/database-url";

const databaseUrl = ensurePrismaDatabaseEnv();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    datasources: { db: { url: databaseUrl } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
