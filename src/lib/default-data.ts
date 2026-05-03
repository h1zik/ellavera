import { ContentValueType, Prisma, SectionType } from "@prisma/client";

export const defaultSettings: Prisma.SiteSettingsCreateInput = {
  id: "default",
  siteName: "Ellavera",
  tagline: "Maklon kosmetik buat Gen-Z & brand owner — tanpa ribet, full energy.",
  brandPurpose:
    "Retro, playful, expressive: kami dukung brand beauty kamu dari formula sampai rak.",
  primaryColor: "#26CCC2",
  secondaryColor: "#FAE3C7",
  accentColor: "#FFB76C",
  contactEmail: "hello@ellavera.id",
  contactWhatsapp: "+6281200000000",
  locationAddress: "Jakarta & sekitarnya — hubungi untuk janji kunjungan factory.",
  mapsUrl: "https://maps.google.com/?q=Jakarta",
  seoTitle: "Ellavera | Maklon kosmetik Gen-Z",
  seoDescription:
    "Private label skincare & bodycare: cepat, legal, bareng tim yang satu energi sama kamu.",
  seoKeywords: "maklon kosmetik, Gen-Z brand, private label, skincare",
  heroImageUrl:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80",
  adminLogoUrl: null,
  faviconUrl: null,
  siteLogoUrl: null,
  talentGalleryJson: null,
};

type SectionSeed = {
  slug: string;
  name: string;
  type: SectionType;
  order: number;
  title?: string;
  subtitle?: string;
  description?: string;
  enabled?: boolean;
  contents: Array<{
    key: string;
    value: string;
    valueType?: ContentValueType;
    sortOrder?: number;
  }>;
};

/** Urutan: Hero → Services → Process → Why Us → Portfolio → Factory → FAQ → Contact */
export const defaultSections: SectionSeed[] = [
  {
    slug: "hero",
    name: "Hero",
    type: SectionType.HERO,
    order: 1,
    title: "Your glow-up factory starts here.",
    subtitle: "Ellavera Beauty · Gen-Z friendly",
    description: "Maklon kosmetik dengan vibe retro & proses yang jelas. Unisex. Buat brand owner yang mau gerak cepat.",
    contents: [
      { key: "cta_primary_label", value: "Mulai konsultasi", sortOrder: 0 },
      { key: "cta_primary_url", value: "#contact", valueType: ContentValueType.URL, sortOrder: 1 },
      { key: "cta_secondary_label", value: "Lihat layanan", sortOrder: 2 },
      { key: "cta_secondary_url", value: "#services", valueType: ContentValueType.URL, sortOrder: 3 },
    ],
  },
  {
    slug: "services",
    name: "Layanan",
    type: SectionType.SERVICES,
    order: 2,
    title: "Yang kami kerjakan",
    description: "End-to-end buat brand maklon — kamu fokus branding & pasar, sisanya kami dukung.",
    contents: [
      { key: "service", value: "Skincare & bodycare maklon", sortOrder: 1 },
      { key: "service", value: "Riset formula & sampling cepat", sortOrder: 2 },
      { key: "service", value: "Packaging & guidance branding", sortOrder: 3 },
      { key: "service", value: "BPOM, Halal & dokumen produksi", sortOrder: 4 },
    ],
  },
  {
    slug: "process",
    name: "Proses",
    type: SectionType.PROCESS,
    order: 3,
    title: "Step by step — biar nggak overwhelming",
    description: "Alurnya transparan; kamu bisa track tiap fase bareng tim kami.",
    contents: [
      { key: "step", value: "Brief & mood brand — cocokin visi produk", sortOrder: 1 },
      { key: "step", value: "Formula & sampel — iterasi sampai cocok di kulit", sortOrder: 2 },
      { key: "step", value: "Packaging & legalitas — dokumen rapi", sortOrder: 3 },
      { key: "step", value: "Produksi & QC — batch konsisten", sortOrder: 4 },
      { key: "step", value: "Launch support — siap go-to-market", sortOrder: 5 },
    ],
  },
  {
    slug: "why-us",
    name: "Why Us",
    type: SectionType.WHY_US,
    order: 4,
    title: "Kenapa Ellavera?",
    description: "Karena kami ngerti bahasa Gen-Z brand: cepat, jujur, dan berani eksplorasi formula.",
    contents: [
      { key: "point", value: "Komunikasi flat — no gatekeeping info MOQ & timeline.", sortOrder: 1 },
      { key: "point", value: "Tim R&D fleksibel buat eksplorasi tekstur & ingredients.", sortOrder: 2 },
      { key: "point", value: "Visual & narasi brand kamu yang utama — kami dukung eksekusi.", sortOrder: 3 },
      { key: "point", value: "Unisex & inklusif: produk untuk siapa pun yang mau glow.", sortOrder: 4 },
    ],
  },
  {
    slug: "portfolio",
    name: "Portofolio",
    type: SectionType.CLIENT_PORTFOLIO,
    order: 5,
    title: "Brand yang pernah bergerak bareng kami",
    description: "Logo & nama disederhanakan sebagai contoh — ganti dengan klien kamu di admin.",
    contents: [
      {
        key: "brand",
        value: JSON.stringify({
          name: "Glow Theory",
          imageUrl:
            "https://placehold.co/280x100/26CCC2/1a1a1a?font=raleway&text=Glow+Theory",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 1,
      },
      {
        key: "brand",
        value: JSON.stringify({
          name: "Velvet Lab",
          imageUrl:
            "https://placehold.co/280x100/FFB76C/1a1a1a?font=raleway&text=Velvet+Lab",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 2,
      },
      {
        key: "brand",
        value: JSON.stringify({
          name: "SUN/SET",
          imageUrl:
            "https://placehold.co/280x100/FAE3C7/1a1a1a?font=raleway&text=SUN%2FSET",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "factory",
    name: "Factory",
    type: SectionType.FACTORY_GALLERY,
    order: 6,
    title: "Factory gallery",
    description: "Cuplikan suasana produksi — higienis, terukur, dan siap scale.",
    contents: [
      {
        key: "photo",
        value: JSON.stringify({
          imageUrl:
            "https://images.unsplash.com/photo-1582719478248-ac9b05cd676a?auto=format&fit=crop&w=900&q=80",
          caption: "Area produksi",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 1,
      },
      {
        key: "photo",
        value: JSON.stringify({
          imageUrl:
            "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=900&q=80",
          caption: "Lab & QC",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 2,
      },
      {
        key: "photo",
        value: JSON.stringify({
          imageUrl:
            "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80",
          caption: "Tim produksi",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "faq",
    name: "FAQ",
    type: SectionType.FAQ,
    order: 7,
    title: "FAQ — langsung aja",
    contents: [
      {
        key: "faq",
        value: JSON.stringify({
          q: "MOQ-nya flexibel nggak?",
          a: "Tergantung jenis produk — kita bisa mulai dari batch kecil buat validasi pasar.",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 1,
      },
      {
        key: "faq",
        value: JSON.stringify({
          q: "Bisa buat konsep unisex / Gen-Z?",
          a: "Banget. Kami suka eksperimen tekstur, scent, dan narasi brand yang bold.",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 2,
      },
      {
        key: "faq",
        value: JSON.stringify({
          q: "Legalitas produk?",
          a: "Kami dampingi BPOM, Halal, dan dokumen yang kamu butuhkan untuk jualan aman.",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "contact",
    name: "Kontak",
    type: SectionType.CONTACT,
    order: 8,
    title: "Contact & lokasi",
    description: "Drop brief atau hubungi langsung — tim kami belokin energi ke solusi buat brand kamu.",
    contents: [],
  },
];
