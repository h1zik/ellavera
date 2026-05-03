import { TalentCard } from "@/lib/talent-gallery";

type Props = {
  items: TalentCard[];
  title?: string;
};

/** Foto talent / tim — data dari Admin → Site Settings (JSON). */
export function TalentGallery({ items, title = "Tim" }: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className="retro-card mx-auto w-full max-w-6xl scroll-mt-24"
      aria-label={title}
    >
      <h2 className="section-title">{title}</h2>
      <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((person, idx) => (
          <li key={`${person.imageUrl}-${idx}`} className="retro-item space-y-3 p-0 overflow-hidden">
            <div className="relative aspect-[4/5] w-full bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL talent dari admin (domain bebas) */}
              <img
                src={person.imageUrl}
                alt={person.name ? `Foto ${person.name}` : `Talent ${idx + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            {(person.name || person.role) && (
              <div className="space-y-0.5 px-4 pb-4 pt-1">
                {person.name ? (
                  <p className="text-lg font-black leading-tight">{person.name}</p>
                ) : null}
                {person.role ? (
                  <p className="text-sm font-semibold uppercase tracking-wide text-black/70">
                    {person.role}
                  </p>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
