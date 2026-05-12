import type { CSSProperties } from "react";
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

  const brandStyle = {
    "--brand-primary": settings?.primaryColor ?? "#26CCC2",
    "--brand-secondary": settings?.secondaryColor ?? "#FAE3C7",
    "--brand-accent": settings?.accentColor ?? "#FFB76C",
  } as CSSProperties;

  return (
    <main
      style={brandStyle}
      className="flex min-h-screen flex-col items-center justify-center bg-[color-mix(in_srgb,var(--brand-secondary)_72%,#faf8f3)] p-4 md:p-8"
    >
      <div className="admin-content-card w-full max-w-md px-6 py-8 md:px-8 md:py-10">
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
            <p className="text-3xl font-black tracking-tight text-[var(--retro-black)] md:text-4xl">
              {siteName}
            </p>
          )}
          <p className="admin-eyebrow mx-auto mt-4 justify-center text-[10px]">Masuk</p>
          {tagline ? (
            <p className="mt-3 text-sm font-semibold leading-snug text-black/55">{tagline}</p>
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
