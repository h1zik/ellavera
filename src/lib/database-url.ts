/**
 * Netlify/Supabase sometimes set DATABASE_URL to a non-Postgres value, or only set
 * SUPABASE_DATABASE_URL. Prisma requires postgresql:// or postgres://.
 */
export function isPostgresConnectionString(raw: string | undefined): boolean {
  const u = raw?.trim();
  if (!u) return false;
  return u.startsWith("postgresql://") || u.startsWith("postgres://");
}

/** First candidate that looks like a Postgres URI. */
export function pickFirstPostgresUrl(...candidates: (string | undefined)[]): string | undefined {
  for (const c of candidates) {
    if (isPostgresConnectionString(c)) return c!.trim();
  }
  return undefined;
}

/**
 * Ensures process.env.DATABASE_URL is a valid Postgres URI when any known env has one.
 * Call once before creating PrismaClient (e.g. at top of prisma.ts).
 */
export function normalizeDatabaseUrlEnv(): void {
  if (isPostgresConnectionString(process.env.DATABASE_URL)) return;

  const picked = pickFirstPostgresUrl(
    process.env.SUPABASE_DATABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
  );

  if (picked) {
    process.env.DATABASE_URL = picked;
  }
}
