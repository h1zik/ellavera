import type { CSSProperties } from "react";
import { SectionType } from "@prisma/client";
import { HomeEnhancements } from "@/components/home-enhancements";
import { LandingSections } from "@/components/landing-sections";
import {
  DEFAULT_PRICELIST_LABEL,
  DEFAULT_PRICELIST_URL,
  toWhatsAppHref,
} from "@/lib/contact-links";
import { firstValue } from "@/lib/section-content";
import { getLandingData } from "@/lib/data";

export default async function Home() {
  const { settings, sections } = await getLandingData();
  const heroSection = sections.find((s) => s.type === SectionType.HERO);
  const sectionsAfterHero = heroSection
    ? sections.filter((s) => s.id !== heroSection.id)
    : sections;
  // Dari item Hero "Teks/Link tombol pricelist"; kalau belum diisi pakai link bawaan.
  // Isi link dengan "-" untuk menyembunyikan tombol.
  const pricelistUrl = heroSection
    ? firstValue(heroSection.contents, "cta_pricelist_url", DEFAULT_PRICELIST_URL).trim()
    : DEFAULT_PRICELIST_URL;
  const pricelist =
    pricelistUrl && pricelistUrl !== "-"
      ? {
          url: pricelistUrl,
          label:
            (heroSection &&
              firstValue(heroSection.contents, "cta_pricelist_label", "").trim()) ||
            DEFAULT_PRICELIST_LABEL,
        }
      : null;
  return (
    <div
      className="retro-shell"
      style={
        {
          "--brand-primary": settings.primaryColor,
          "--brand-secondary": settings.secondaryColor,
          "--brand-accent": settings.accentColor,
        } as CSSProperties
      }
    >
      <a className="skip-to-main" href="#main-content">
        Langsung ke isi
      </a>
      <HomeEnhancements
        sectionSlugs={sections.map((s) => s.slug)}
        whatsappHref={settings.contactWhatsapp ? toWhatsAppHref(settings.contactWhatsapp) : null}
      />
      {/* Bar ringkas yang muncul setelah header lewat — HomeEnhancements mengatur tampil & link aktif. */}
      <div className="home-sticky-bar" data-sticky-bar>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 md:px-6">
          <a href="#main-content" className="hidden shrink-0 text-base font-black tracking-tight md:block">
            {settings.siteName}
          </a>
          <nav className="home-sticky-nav" aria-label="Navigasi cepat" data-scrollspy-nav>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.slug}`}
                className="home-sticky-link"
                data-spy={section.slug}
                data-track="nav"
              >
                {section.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
      <main
        id="main-content"
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
              {settings.headerEyebrow?.trim() ? (
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/50">
                  {settings.headerEyebrow.trim()}
                </p>
              ) : null}
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
            <nav className="home-nav" aria-label="Navigasi section">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.slug}`}
                  className="retro-nav-link"
                  data-track="nav"
                >
                  {section.name}
                </a>
              ))}
            </nav>
          </header>

          <div className="flex flex-col gap-8 md:gap-10">
            {heroSection ? (
              <LandingSections sections={[heroSection]} settings={settings} pricelist={pricelist} />
            ) : null}

            {sectionsAfterHero.length > 0 ? (
              <LandingSections sections={sectionsAfterHero} settings={settings} pricelist={pricelist} />
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
                      <a href={`#${section.slug}`} className="retro-nav-link text-[11px]" data-track="nav">
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
