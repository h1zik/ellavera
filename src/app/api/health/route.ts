import { NextResponse } from "next/server";

/**
 * Ringan: tidak impor Prisma. Berguna untuk cek apakah proses Node + router Next hidup
 * (mis. Node.js Web App di Hostinger vs error 503 dari upstream).
 */
export function GET() {
  const raw = process.env.DATABASE_URL?.trim() ?? "";
  const looksPostgres =
    raw.startsWith("postgresql://") || raw.startsWith("postgres://");
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    node: process.version,
    hasDatabaseUrl: Boolean(raw),
    databaseUrlLooksLikePostgres: looksPostgres,
    hasDirectUrl: Boolean(process.env.DIRECT_URL?.trim()),
  });
}
