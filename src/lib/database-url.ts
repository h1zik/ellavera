/**
 * Netlify/Supabase sometimes set DATABASE_URL to a non-Postgres value, or only set
 * SUPABASE_DATABASE_URL. Prisma requires postgresql:// or postgres://.
 *
 * Important: `https://<ref>.supabase.co` (API / project URL) is NOT a Postgres URI.
 * Use Supabase Dashboard → Project Settings → Database → Connection string → URI.
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

function firstHttpLikeEnv(): string | undefined {
  const keys = [
    process.env.DATABASE_URL,
    process.env.SUPABASE_DATABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL,
  ];
  for (const v of keys) {
    const t = v?.trim();
    if (t?.startsWith("http://") || t?.startsWith("https://")) return t;
  }
  return undefined;
}

/**
 * Ensures process.env.DATABASE_URL is a valid Postgres URI when any known env has one.
 * Call before creating PrismaClient.
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

/**
 * Returns a Postgres URI for Prisma, or throws with Netlify/Supabase-specific guidance.
 */
export function assertDatabaseUrlConfigured(): string {
  normalizeDatabaseUrlEnv();
  const url = process.env.DATABASE_URL?.trim();
  if (isPostgresConnectionString(url)) return url!;

  const httpLike = firstHttpLikeEnv();
  const lines = [
    "Prisma butuh DATABASE_URL berupa URI Postgres (awalan postgresql:// atau postgres://).",
    "",
    "Di Supabase: Project Settings → Database → Connection string → pilih tab URI,",
    "lalu salin string yang dimulai dengan postgresql://… (bisa Session mode / Transaction).",
    "Tempel sebagai DATABASE_URL di Netlify (Environment variables).",
    "",
    "URL https://xxxx.supabase.co adalah alamat API project (untuk Supabase JS),",
    "bukan koneksi database — jangan dipakai sebagai DATABASE_URL atau SUPABASE_DATABASE_URL.",
  ];
  if (httpLike) {
    lines.push("", `Nilai non-Postgres terdeteksi (contoh): ${httpLike.slice(0, 72)}${httpLike.length > 72 ? "…" : ""}`);
  }

  throw new Error(lines.join("\n"));
}
