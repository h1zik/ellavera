/**
 * Netlify/Supabase sometimes set DATABASE_URL to a non-Postgres value, or only set
 * SUPABASE_DATABASE_URL. Prisma requires postgresql:// or postgres://.
 *
 * Important: `https://<ref>.supabase.co` (API / project URL) is NOT a Postgres URI.
 * Use Supabase Dashboard → Project Settings → Database → Connection string → URI.
 *
 * Supabase **Transaction** pooler (`*.pooler.supabase.com:6543`) often blocks or hangs on
 * `prisma db push` (DDL). Set DIRECT_URL to **Direct** or **Session** Postgres URI (port 5432).
 */
export function isPostgresConnectionString(raw: string | undefined): boolean {
  const u = raw?.trim();
  if (!u) return false;
  return u.startsWith("postgresql://") || u.startsWith("postgres://");
}

/** Transaction pooler — avoid DDL through this URL. */
export function isLikelySupabaseTransactionPooler(raw: string | undefined): boolean {
  const u = raw?.toLowerCase() ?? "";
  return u.includes("pooler.supabase.com") && u.includes(":6543");
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
 * Sets DIRECT_URL when safe: copy DATABASE_URL if not on Transaction pooler.
 * Otherwise leaves DIRECT_URL unchanged (must be set explicitly in Netlify).
 */
export function normalizeDirectUrlEnv(): void {
  if (isPostgresConnectionString(process.env.DIRECT_URL)) return;

  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!isPostgresConnectionString(dbUrl)) return;

  if (isLikelySupabaseTransactionPooler(dbUrl)) return;

  process.env.DIRECT_URL = dbUrl;
}

function throwMissingDatabaseUrl(): never {
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

function throwMissingDirectUrl(): never {
  throw new Error(
    [
      "DATABASE_URL memakai Supabase Transaction pooler (…pooler.supabase.com:6543).",
      "Prisma `db push` / migrasi membutuhkan koneksi yang mendukung DDL.",
      "",
      "Tambahkan env DIRECT_URL berupa connection string Direct atau Session dari Supabase:",
      "Project Settings → Database → Connection string → Direct connection (host db.<ref>.supabase.co:5432)",
      "atau Session pooler (bukan Transaction :6543).",
      "",
      "Di .env lokal, DIRECT_URL boleh sama dengan DATABASE_URL jika koneksinya bukan pooler :6543.",
    ].join("\n"),
  );
}

/**
 * Normalizes DATABASE_URL + DIRECT_URL and validates both for Prisma (generate, db push, client).
 */
export function ensurePrismaDatabaseEnv(): string {
  normalizeDatabaseUrlEnv();
  const url = process.env.DATABASE_URL?.trim();
  if (!isPostgresConnectionString(url)) {
    throwMissingDatabaseUrl();
  }

  normalizeDirectUrlEnv();

  if (!isPostgresConnectionString(process.env.DIRECT_URL)) {
    if (isLikelySupabaseTransactionPooler(url)) {
      throwMissingDirectUrl();
    }
    process.env.DIRECT_URL = url;
  }

  return url!;
}

/** @deprecated use ensurePrismaDatabaseEnv */
export function assertDatabaseUrlConfigured(): string {
  return ensurePrismaDatabaseEnv();
}
