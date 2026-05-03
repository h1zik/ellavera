import Image from "next/image";
import { SectionType, SiteSettings } from "@prisma/client";
import { LeadForm } from "@/components/lead-form";
import { SectionWithContents } from "@/lib/types";
import { byKey, firstValue, parseJson } from "@/lib/section-content";

type Props = {
  sections: SectionWithContents[];
  settings: SiteSettings;
};

export function LandingSections({ sections, settings }: Props) {
  return (
    <>
      {sections.map((section) => (
        <section
          id={section.slug}
          key={section.id}
          className="retro-card mx-auto w-full max-w-6xl scroll-mt-24"
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
    case SectionType.PROCESS:
      return <ListSection section={section} itemKey="step" />;
    case SectionType.SERVICES:
      return <ListSection section={section} itemKey="service" />;
    case SectionType.TESTIMONIALS:
      return <TestimonialSection section={section} />;
    case SectionType.EDUCATIONAL:
      return <EducationSection section={section} />;
    case SectionType.FAQ:
      return <FaqSection section={section} />;
    case SectionType.CONTACT:
      return <ContactSection section={section} />;
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
  const ctaPrimaryLabel = firstValue(section.contents, "cta_primary_label", "Consult Now");
  const ctaPrimaryUrl = firstValue(section.contents, "cta_primary_url", "#contact");
  const ctaSecondaryLabel = firstValue(section.contents, "cta_secondary_label", "See Process");
  const ctaSecondaryUrl = firstValue(section.contents, "cta_secondary_url", "#process");

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <div className="space-y-4">
        <p className="badge">{section.subtitle || "Ellavera Beauty"}</p>
        <h1 className="text-4xl font-black leading-tight md:text-6xl">{section.title}</h1>
        <p className="text-lg">{section.description}</p>
        <p className="text-sm font-semibold uppercase tracking-wide">
          {settings.brandPurpose}
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={ctaPrimaryUrl} className="retro-button">
            {ctaPrimaryLabel}
          </a>
          <a href={ctaSecondaryUrl} className="retro-button-alt">
            {ctaSecondaryLabel}
          </a>
        </div>
      </div>
      <div className="relative h-[320px] overflow-hidden rounded-2xl border-4 border-black md:h-[420px]">
        {settings.heroImageUrl ? (
          <Image
            src={settings.heroImageUrl}
            alt="Tim Ellavera menyiapkan produk kosmetik"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}

function ListSection({
  section,
  itemKey,
}: {
  section: SectionWithContents;
  itemKey: string;
}) {
  const items = byKey(section.contents, itemKey);
  return (
    <div className="space-y-4">
      <h2 className="section-title">{section.title}</h2>
      {section.description ? <p className="section-description">{section.description}</p> : null}
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <li key={item.id} className="retro-item">
            <span className="mr-2 font-black">{String(index + 1).padStart(2, "0")}.</span>
            {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestimonialSection({ section }: { section: SectionWithContents }) {
  const testimonials = byKey(section.contents, "testimonial").map((entry) =>
    parseJson<{ quote: string; author: string }>(entry.value, {
      quote: entry.value,
      author: "Ellavera Client",
    }),
  );

  return (
    <div className="space-y-4">
      <h2 className="section-title">{section.title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((item, idx) => (
          <blockquote key={`${item.author}-${idx}`} className="retro-item">
            <p className="text-lg font-semibold">&quot;{item.quote}&quot;</p>
            <footer className="mt-3 text-sm uppercase tracking-wide">{item.author}</footer>
          </blockquote>
        ))}
      </div>
    </div>
  );
}

function EducationSection({ section }: { section: SectionWithContents }) {
  const articles = byKey(section.contents, "article").map((entry) =>
    parseJson<{ title: string; excerpt: string; url: string }>(entry.value, {
      title: "Artikel Maklon Kosmetik",
      excerpt: entry.value,
      url: "#",
    }),
  );

  return (
    <div className="space-y-4">
      <h2 className="section-title">{section.title}</h2>
      {section.description ? <p className="section-description">{section.description}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article, idx) => (
          <article key={`${article.title}-${idx}`} className="retro-item">
            <h3 className="text-xl font-black">{article.title}</h3>
            <p className="mt-2">{article.excerpt}</p>
            <a href={article.url} className="mt-4 inline-block text-sm font-bold underline">
              Baca selengkapnya
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
    <div className="space-y-4">
      <h2 className="section-title">{section.title}</h2>
      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <details key={`${faq.q}-${idx}`} className="retro-item">
            <summary className="cursor-pointer text-lg font-black">{faq.q}</summary>
            <p className="mt-2">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

function ContactSection({ section }: { section: SectionWithContents }) {
  return (
    <div className="space-y-4">
      <h2 className="section-title">{section.title}</h2>
      {section.description ? <p className="section-description">{section.description}</p> : null}
      <LeadForm />
    </div>
  );
}
