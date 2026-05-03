import { ContentValueType, Prisma, SectionType } from "@prisma/client";

export const defaultSettings: Prisma.SiteSettingsCreateInput = {
  id: "default",
  siteName: "Ellavera",
  tagline: "Maklon Kosmetik Anti Ribet untuk Brand Owner Gen-Z",
  brandPurpose:
    "Ellavera Beauty hadir untuk mematahkan stigma bahwa bikin brand kosmetik itu susah dan ribet. Kita ada untuk menuntun, menyederhanakan proses, dan bertumbuh bersama brand owner.",
  primaryColor: "#26CCC2",
  secondaryColor: "#FAE3C7",
  accentColor: "#FFB76C",
  contactEmail: "hello@ellavera.id",
  contactWhatsapp: "+62 812-0000-0000",
  seoTitle: "Maklon Kosmetik Ellavera | Bangun Brand Beauty Tanpa Ribet",
  seoDescription:
    "Ellavera membantu brand owner Gen-Z menciptakan brand kosmetik private label dengan proses cepat, transparan, dan scalable.",
  seoKeywords:
    "maklon kosmetik, private label kosmetik, jasa maklon skincare, pabrik kosmetik",
  heroImageUrl:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80",
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

export const defaultSections: SectionSeed[] = [
  {
    slug: "hero",
    name: "Hero",
    type: SectionType.HERO,
    order: 1,
    title: "Bangun Brand Kosmetikmu Tanpa Drama",
    subtitle: "Maklon Kosmetik Gen-Z",
    description:
      "Dari ide sampai launching, Ellavera bantu kamu produksi kosmetik yang standout, legal, dan siap scale.",
    contents: [
      { key: "cta_primary_label", value: "Konsultasi Gratis Sekarang" },
      { key: "cta_primary_url", value: "#contact", valueType: ContentValueType.URL },
      { key: "cta_secondary_label", value: "Lihat Proses Maklon" },
      { key: "cta_secondary_url", value: "#process", valueType: ContentValueType.URL },
    ],
  },
  {
    slug: "process",
    name: "Process Steps",
    type: SectionType.PROCESS,
    order: 2,
    title: "Proses Bikin Brand dalam 5 Step",
    description: "Simple, transparan, dan dipandu tim ahli dari nol.",
    contents: [
      { key: "step", value: "Discovery Brand & Formula", sortOrder: 1 },
      { key: "step", value: "Riset Produk & Positioning", sortOrder: 2 },
      { key: "step", value: "Sampling & Revisi Cepat", sortOrder: 3 },
      { key: "step", value: "Legalitas & Produksi", sortOrder: 4 },
      { key: "step", value: "Go-to-Market Support", sortOrder: 5 },
    ],
  },
  {
    slug: "services",
    name: "Services",
    type: SectionType.SERVICES,
    order: 3,
    title: "Layanan End-to-End Ellavera",
    contents: [
      { key: "service", value: "Maklon Skincare & Bodycare", sortOrder: 1 },
      { key: "service", value: "Custom Formula Development", sortOrder: 2 },
      { key: "service", value: "Packaging & Branding Advisory", sortOrder: 3 },
      { key: "service", value: "Regulatory Support (BPOM/Halal)", sortOrder: 4 },
    ],
  },
  {
    slug: "testimonials",
    name: "Testimonials",
    type: SectionType.TESTIMONIALS,
    order: 4,
    title: "Brand Owner Stories",
    contents: [
      {
        key: "testimonial",
        value: JSON.stringify({
          quote: "Dari ide random di TikTok sampai launch produk cuma 4 bulan.",
          author: "Nadia, Founder of Velmora",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 1,
      },
      {
        key: "testimonial",
        value: JSON.stringify({
          quote: "Tim Ellavera nge-guide dari formula, design, sampai strategi launch.",
          author: "Raka, Co-founder of MINE LAB",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "educational",
    name: "Educational Content",
    type: SectionType.EDUCATIONAL,
    order: 5,
    title: "Edukasi Maklon Kosmetik",
    description: "Konten SEO-ready untuk bantu calon brand owner memahami industri.",
    contents: [
      {
        key: "article",
        value: JSON.stringify({
          title: "Apa Itu Maklon Kosmetik dan Kenapa Penting untuk Brand Baru?",
          excerpt:
            "Panduan lengkap tentang skema produksi private label, minimum order, dan timeline launching.",
          url: "#",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 1,
      },
      {
        key: "article",
        value: JSON.stringify({
          title: "Cara Memilih Partner Maklon Kosmetik yang Tepat",
          excerpt: "Checklist legalitas, kualitas R&D, dan dukungan go-to-market.",
          url: "#",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "faq",
    name: "FAQ",
    type: SectionType.FAQ,
    order: 6,
    title: "Pertanyaan yang Sering Ditanyakan",
    contents: [
      {
        key: "faq",
        value: JSON.stringify({
          q: "Berapa minimum order maklon di Ellavera?",
          a: "MOQ bervariasi tergantung jenis produk, mulai dari batch kecil untuk validasi market.",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 1,
      },
      {
        key: "faq",
        value: JSON.stringify({
          q: "Apakah Ellavera bantu legalitas produk?",
          a: "Ya, kami dampingi proses BPOM, Halal, dan dokumen teknis produksi.",
        }),
        valueType: ContentValueType.JSON,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "contact",
    name: "Contact",
    type: SectionType.CONTACT,
    order: 7,
    title: "Mulai Konsultasi Brand Kamu",
    description: "Isi form ini dan tim Ellavera akan menghubungi kamu dalam 1x24 jam.",
    contents: [],
  },
];
