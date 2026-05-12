import type { CSSProperties } from "react";
import { SectionType } from "@prisma/client";
import { HomeEnhancements } from "@/components/home-enhancements";
import { LandingSections } from "@/components/landing-sections";
import { getLandingData } from "@/lib/data";

export default async function Home() {
  const { settings, sections } = await getLandingData();
  const heroSection = sections.find((s) => s.type === SectionType.HERO);
  const sectionsAfterHero = heroSection
    ? sections.filter((s) => s.id !== heroSection.id)
    : sections;
  return (
    <div className="retro-shell">
      <a className="skip-to-main" href="#main-content">
        Langsung ke isi
      </a>
      <HomeEnhancements />
      <main
        id="main-content"
        style={
          {
            "--brand-primary": settings.primaryColor,
            "--brand-secondary": settings.secondaryColor,
            "--brand-accent": settings.accentColor,
          } as CSSProperties
        }
        className="min-h-screen bg-transparent px-4 pb-12 pt-6 md:px-6 md:pb-12 md:pt-6"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:gap-12">
          <div className="retro-top-stripes" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <header className="retro-header-panel z-10 flex w-full flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="relative z-10 max-w-xl space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/50">
                Maklon · Gen-Z · Unisex
              </p>
              {settings.siteLogoUrl?.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL dari CMS (Supabase/dll.)
                <img
                  src={settings.siteLogoUrl.trim()}
                  alt={settings.siteName}
                  className="h-10 w-auto max-w-[min(100%,220px)] object-contain object-left md:h-12 md:max-w-[260px]"
                  width={260}
                  height={48}
                />
              ) : (
                <p className="text-2xl font-black leading-none tracking-tight text-[var(--retro-black)] md:text-3xl">
                  {settings.siteName}
                </p>
              )}
              <p className="max-w-md text-sm font-semibold leading-relaxed text-black/75 md:text-base">
                {settings.tagline}
              </p>
            </div>
            <nav
              className="relative z-10 flex max-w-2xl flex-wrap justify-end gap-2 md:max-w-[58%]"
              aria-label="Navigasi section"
            >
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.slug}`}
                  className="retro-nav-link"
                >
                  {section.name}
                </a>
              ))}
            </nav>
          </header>

          <div className="flex flex-col gap-8 md:gap-10">
            {heroSection ? (
              <LandingSections sections={[heroSection]} settings={settings} />
            ) : null}

            {sectionsAfterHero.length > 0 ? (
              <LandingSections sections={sectionsAfterHero} settings={settings} />
            ) : null}
          </div>

          <footer className="retro-footer-panel text-sm text-black/85">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-black/15 pb-4">
              <p className="font-black uppercase tracking-widest text-black/70">
                © {new Date().getFullYear()} {settings.siteName}
              </p>
              <a
                className="retro-focus rounded-lg border-2 border-black/20 bg-white/50 px-3 py-1.5 text-xs font-black uppercase tracking-wide transition hover:border-black/40 hover:bg-white/90"
                href="/admin"
              >
                Admin
              </a>
            </div>
            {sections.length > 0 ? (
              <nav
                className="home-footer-nav mt-4 flex flex-col gap-2.5"
                aria-label="Lompat ke section di halaman ini"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-black/45">
                  Lompat ke section
                </p>
                <ul className="flex flex-wrap gap-2">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.slug}`} className="retro-nav-link text-[11px]">
                        {section.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
            {settings.brandPurpose ? (
              <p className="mt-4 max-w-2xl text-xs leading-relaxed text-black/55">
                {settings.brandPurpose}
              </p>
            ) : null}
          </footer>
        </div>
      </main>
    </div>
  );
}
