import type { CSSProperties } from "react";
import { LandingSections } from "@/components/landing-sections";
import { getLandingData } from "@/lib/data";

export default async function Home() {
  const { settings, sections } = await getLandingData();

  return (
    <main
      style={
        {
          "--brand-primary": settings.primaryColor,
          "--brand-secondary": settings.secondaryColor,
          "--brand-accent": settings.accentColor,
        } as CSSProperties
      }
      className="min-h-screen space-y-8 bg-[var(--brand-secondary)] px-4 py-8 md:px-8"
    >
      <header className="retro-card mx-auto flex w-full max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-widest">Ellavera Beauty</p>
          <p className="text-3xl font-black">{settings.siteName}</p>
          <p className="text-base">{settings.tagline}</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.slug}`} className="retro-button-alt text-xs">
              {section.name}
            </a>
          ))}
        </nav>
      </header>

      <LandingSections sections={sections} settings={settings} />

      <footer className="retro-card mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 text-sm">
        <p>© {new Date().getFullYear()} Ellavera Beauty</p>
        <a
          className="font-bold underline"
          href="/admin"
        >
          Admin Dashboard
        </a>
      </footer>
    </main>
  );
}
