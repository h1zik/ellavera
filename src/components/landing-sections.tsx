import Image from "next/image";
import { SectionType, SiteSettings } from "@prisma/client";
import { LeadForm } from "@/components/lead-form";
import { parseLeadFormFieldsJson } from "@/lib/lead-form-config";
import { toWhatsAppHref } from "@/lib/contact-links";
import { SectionWithContents } from "@/lib/types";
import { byKey, firstValue, parseJson } from "@/lib/section-content";

function SectionIntro({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string | null | undefined;
  description?: string | null;
}) {
  return (
    <header className="section-intro">
      <p className="section-intro-badge">{badge}</p>
      <div className="section-intro-body">
        {title ? <h2 className="section-title title-pop">{title}</h2> : null}
        {description?.trim() ? (
          <p className="section-description max-w-2xl font-medium text-black/85">
            {description.trim()}
          </p>
        ) : null}
      </div>
    </header>
  );
}

type Props = {
  sections: SectionWithContents[];
  settings: SiteSettings;
};

export function LandingSections({ sections, settings }: Props) {
  return (
    <>
      {sections.map((section, index) => (
        <section
          id={section.slug}
          key={section.id}
          className={[
            "retro-card mx-auto w-full max-w-6xl scroll-mt-[5.5rem] md:scroll-mt-28",
            index % 2 === 1 ? "section-tone-alt" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {renderSection(section, settings)}
        </section>
      ))}
    </>
  );
}

function renderSection(section: SectionWithContents, settings: SiteSettings) {
  switch (section.type) {
    case SectionType.HERO:
      return <HeroSection section={section} settings={settings} />;
    case SectionType.SERVICES:
      return <ServicesSection section={section} />;
    case SectionType.PROCESS:
      return <ProcessSection section={section} />;
    case SectionType.WHY_US:
      return <WhyUsSection section={section} />;
    case SectionType.CLIENT_PORTFOLIO:
      return <ClientPortfolioSection section={section} />;
    case SectionType.FACTORY_GALLERY:
      return <FactoryGallerySection section={section} />;
    case SectionType.TESTIMONIALS:
      return <TestimonialSection section={section} />;
    case SectionType.EDUCATIONAL:
      return <EducationSection section={section} />;
    case SectionType.FAQ:
      return <FaqSection section={section} />;
    case SectionType.CONTACT:
      return <ContactSection section={section} settings={settings} />;
    default:
      return null;
  }
}

function HeroSection({
  section,
  settings,
}: {
  section: SectionWithContents;
  settings: SiteSettings;
}) {
  const ctaPrimaryLabel = firstValue(section.contents, "cta_primary_label", "Konsultasi");
  const ctaPrimaryUrl = firstValue(section.contents, "cta_primary_url", "#contact");
  const ctaSecondaryLabel = firstValue(section.contents, "cta_secondary_label", "Layanan");
  const ctaSecondaryUrl = firstValue(section.contents, "cta_secondary_url", "#services");

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <div className="space-y-5">
        <p className="badge badge-tilt">{section.subtitle || "Ellavera"}</p>
        <p className="retro-section-kicker">Retro · Playful · High-energy</p>
        <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-balance text-[var(--retro-black)] md:text-5xl lg:text-6xl">
          {section.title}
        </h1>
        {section.description ? (
          <p className="max-w-lg text-base font-medium leading-relaxed text-black/85 md:text-lg">
            {section.description}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 pt-1">
          <a href={ctaPrimaryUrl} className="retro-button">
            {ctaPrimaryLabel}
          </a>
          <a href={ctaSecondaryUrl} className="retro-button-alt">
            {ctaSecondaryLabel}
          </a>
        </div>
        <p className="max-w-md pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/40">
          Gratis konsultasi awal · Respon cepat di WhatsApp
        </p>
      </div>
      <div className="relative h-[300px] md:h-[420px] lg:rotate-[1.25deg]">
        <div className="hero-photo-frame relative h-full w-full">
          {settings.heroImageUrl ? (
            <Image
              src={settings.heroImageUrl}
              alt="Ellavera beauty maklon"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ServicesSection({ section }: { section: SectionWithContents }) {
  const items = byKey(section.contents, "service");
  return (
    <div className="space-y-5">
      <SectionIntro
        badge={section.name}
        title={section.title}
        description={section.description}
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={[
              "retro-item retro-item-playful",
              index % 2 === 0 ? "playful-tint-cyan" : "playful-tint-orange",
            ].join(" ")}
          >
            <span className="mb-2 inline-block text-2xl" aria-hidden>
              {index % 2 === 0 ? "✦" : "◆"}
            </span>
            <p className="text-base font-bold leading-snug">{item.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProcessSection({ section }: { section: SectionWithContents }) {
  const items = byKey(section.contents, "step");
  return (
    <div className="space-y-5">
      <SectionIntro
        badge={section.name}
        title={section.title}
        description={section.description}
      />
      <ol className="space-y-8">
        {items.map((item, index) => (
          <li key={item.id} className="flex gap-4">
            <div className="flex w-12 shrink-0 flex-col items-center self-stretch md:w-14">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-black bg-[var(--brand-primary)] text-sm font-black shadow-[4px_4px_0_0_rgba(0,0,0,0.9)] md:h-12 md:w-12 md:text-base"
                aria-hidden
              >
                {index + 1}
              </span>
              {index < items.length - 1 ? (
                <span
                  className="mt-3 w-1 flex-1 min-h-[1.5rem] rounded-full bg-gradient-to-b from-[var(--brand-primary)] via-[var(--brand-accent)] to-black/20"
                  aria-hidden
                />
              ) : null}
            </div>
            <div className="retro-item min-w-0 flex-1">
              <p className="text-base font-bold leading-relaxed">{item.value}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function WhyUsSection({ section }: { section: SectionWithContents }) {
  const points = byKey(section.contents, "point");
  return (
    <div className="space-y-5">
      <SectionIntro
        badge={section.name}
        title={section.title}
        description={section.description}
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {points.map((item, i) => (
          <li key={item.id} className="retro-ticket">
            <span
              className="text-xl font-black text-[var(--brand-primary)]"
              aria-hidden
            >
              {i + 1}
            </span>
            <p className="text-sm font-semibold leading-relaxed text-black/90">{item.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

type BrandLogo = { name: string; imageUrl: string };

function ClientPortfolioSection({ section }: { section: SectionWithContents }) {
  const brands = byKey(section.contents, "brand").map((entry) =>
    parseJson<BrandLogo>(entry.value, { name: "Brand", imageUrl: "" }),
  );

  return (
    <div className="space-y-5">
      <SectionIntro
        badge={section.name}
        title={section.title}
        description={section.description}
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand, idx) =>
          brand.imageUrl ? (
            <li
              key={`${brand.name}-${idx}`}
              className="retro-item flex flex-col items-center justify-center gap-3 bg-white p-6 grayscale transition-[filter,transform] hover:grayscale-0 hover:-rotate-1"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- URL logo dari admin */}
              <img
                src={brand.imageUrl}
                alt={brand.name ? `Logo ${brand.name}` : "Logo klien"}
                className="h-14 w-full max-w-[220px] object-contain"
                loading="lazy"
              />
              {brand.name ? (
                <p className="text-center text-xs font-black uppercase tracking-widest text-black/60">
                  {brand.name}
                </p>
              ) : null}
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}

type FactoryPhoto = { imageUrl: string; caption?: string };

function FactoryGallerySection({ section }: { section: SectionWithContents }) {
  const photos = byKey(section.contents, "photo").map((entry) =>
    parseJson<FactoryPhoto>(entry.value, { imageUrl: "" }),
  );

  return (
    <div className="space-y-5">
      <SectionIntro
        badge={section.name}
        title={section.title}
        description={section.description}
      />
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, idx) =>
          photo.imageUrl ? (
            <li
              key={`${photo.imageUrl}-${idx}`}
              className="retro-polaroid transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] w-full border-b-2 border-[var(--retro-black)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- URL dinamis dari admin */}
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || `Foto fasilitas ${idx + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              {photo.caption ? (
                <p className="retro-polaroid-caption text-black/80">{photo.caption}</p>
              ) : null}
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}

function TestimonialSection({ section }: { section: SectionWithContents }) {
  const testimonials = byKey(section.contents, "testimonial").map((entry) =>
    parseJson<{ quote: string; author: string }>(entry.value, {
      quote: entry.value,
      author: "Client",
    }),
  );

  return (
    <div className="space-y-4">
      <SectionIntro badge={section.name} title={section.title} />
      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((item, idx) => (
          <blockquote key={`${item.author}-${idx}`} className="retro-item">
            <p className="text-base font-semibold leading-snug">&quot;{item.quote}&quot;</p>
            <footer className="mt-2 text-xs uppercase tracking-wide text-black/70">
              {item.author}
            </footer>
          </blockquote>
        ))}
      </div>
    </div>
  );
}

function EducationSection({ section }: { section: SectionWithContents }) {
  const articles = byKey(section.contents, "article").map((entry) =>
    parseJson<{ title: string; excerpt: string; url: string }>(entry.value, {
      title: "Artikel",
      excerpt: entry.value,
      url: "#",
    }),
  );

  return (
    <div className="space-y-4">
      <SectionIntro
        badge={section.name}
        title={section.title}
        description={section.description}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article, idx) => (
          <article key={`${article.title}-${idx}`} className="retro-item">
            <h3 className="text-lg font-black leading-snug">{article.title}</h3>
            {article.excerpt ? (
              <p className="mt-2 line-clamp-2 text-sm text-black/80">{article.excerpt}</p>
            ) : null}
            <a href={article.url} className="mt-3 inline-block text-sm font-bold underline">
              Baca
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}

function FaqSection({ section }: { section: SectionWithContents }) {
  const faqs = byKey(section.contents, "faq").map((entry) =>
    parseJson<{ q: string; a: string }>(entry.value, {
      q: "Pertanyaan",
      a: entry.value,
    }),
  );

  return (
    <div className="space-y-5">
      <SectionIntro badge={section.name} title={section.title} />
      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <details
            key={`${faq.q}-${idx}`}
            className="retro-item group border-[var(--retro-black)]/18 open:border-[var(--brand-primary)] open:bg-white/95 open:ring-2 open:ring-[var(--brand-primary)]/35"
          >
            <summary className="cursor-pointer list-none text-base font-black leading-snug">
              <span className="mr-2 inline-block text-[var(--brand-accent)] transition-transform duration-200 group-open:rotate-90">
                ▸
              </span>
              {faq.q}
            </summary>
            <p className="mt-3 border-l-4 border-[var(--brand-primary)] pl-4 text-sm font-medium leading-relaxed text-black/85">
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

function ContactSection({
  section,
  settings,
}: {
  section: SectionWithContents;
  settings: SiteSettings;
}) {
  const wa = toWhatsAppHref(settings.contactWhatsapp);
  const leadFields = parseLeadFormFieldsJson(settings.leadFormFieldsJson);

  return (
    <div className="space-y-6">
      <SectionIntro
        badge={section.name}
        title={section.title}
        description={section.description}
      />
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="retro-contact-panel">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black/70">
            Lokasi & kanal
          </h3>
          {settings.locationAddress ? (
            <p className="text-sm font-semibold leading-relaxed text-black/90 whitespace-pre-line">
              {settings.locationAddress}
            </p>
          ) : (
            <p className="text-sm text-black/55">Alamat akan tampil di sini setelah diisi di Admin.</p>
          )}
          <div className="flex flex-col gap-3 text-sm font-bold">
            {settings.contactEmail ? (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="w-fit underline decoration-[var(--brand-primary)] decoration-2 underline-offset-4 hover:text-[var(--brand-primary)]"
              >
                {settings.contactEmail}
              </a>
            ) : null}
            {settings.contactWhatsapp ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit rounded-xl bg-[#25D366] px-4 py-2 font-black uppercase tracking-wide text-white shadow-md transition hover:-translate-y-0.5"
              >
                Chat WhatsApp
              </a>
            ) : null}
            {settings.mapsUrl ? (
              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="retro-button-alt mt-1 inline-flex w-fit"
              >
                Buka di Maps
              </a>
            ) : null}
          </div>
        </div>
        <div className="retro-lead-panel space-y-4">
          <div>
            <p className="retro-lead-heading">Kirim brief</p>
            <p className="mt-1 text-xs font-medium text-black/55 md:text-sm">
              Isi form di bawah — respons tim biasanya dalam 1 hari kerja.
            </p>
          </div>
          <LeadForm fields={leadFields} />
        </div>
      </div>
    </div>
  );
}
