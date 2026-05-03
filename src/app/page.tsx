import type { CSSProperties } from "react";
import { SectionType } from "@prisma/client";
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
      <main
        style={
          {
            "--brand-primary": settings.primaryColor,
            "--brand-secondary": settings.secondaryColor,
            "--brand-accent": settings.accentColor,
          } as CSSProperties
        }
        className="min-h-screen bg-transparent px-4 py-6 md:px-6 md:py-10"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:gap-12">
          <div className="retro-top-stripes" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <header className="retro-header-panel z-10 flex w-full flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="relative z-10 max-w-xl space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/50">
                Maklon · Gen-Z · Unisex
              </p>
              <p className="text-2xl font-black leading-none tracking-tight text-[var(--retro-black)] md:text-3xl">
                {settings.siteName}
              </p>
              <p className="text-sm font-semibold leading-snug text-black/75 md:text-base">
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
                className="retro-focus rounded-lg border-2 border-black/20 px-3 py-1.5 text-xs font-black uppercase tracking-wide underline-offset-4 hover:border-black/40"
                href="/admin"
              >
                Admin
              </a>
            </div>
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
