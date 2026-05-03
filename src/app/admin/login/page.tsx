import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { ensureSeedData } from "@/lib/data";
import { prisma } from "@/lib/prisma";

function safeInternalPath(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/admin";
  }
  return raw;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  await ensureSeedData();
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  const siteName = settings?.siteName ?? "Ellavera";
  const tagline = settings?.tagline ?? "";
  const logoUrl = settings?.adminLogoUrl?.trim() || null;
  const redirectAfterLogin = safeInternalPath(searchParams.next);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--brand-secondary)] p-4">
      <div className="retro-card w-full max-w-md px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        <div className="text-center">
          {logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- logo dari CMS (URL bebas) */}
              <img
                src={logoUrl}
                alt=""
                className="mx-auto h-16 w-auto max-w-[220px] object-contain"
              />
            </>
          ) : (
            <p className="text-3xl font-black tracking-tight text-[var(--brand-primary)]">
              {siteName}
            </p>
          )}
          <p className="mt-2 text-sm font-bold text-black/65">Panel admin</p>
          {tagline ? (
            <p className="mt-1 text-xs font-semibold leading-snug text-black/50">{tagline}</p>
          ) : null}
        </div>
        <AdminLoginForm redirectAfterLogin={redirectAfterLogin} />
        <p className="mt-6 text-center text-xs text-black/45">
          Kredensial dari env{" "}
          <code className="rounded bg-black/5 px-1 py-0.5">ADMIN_USER</code> /{" "}
          <code className="rounded bg-black/5 px-1 py-0.5">ADMIN_PASSWORD</code>
        </p>
      </div>
    </main>
  );
}
