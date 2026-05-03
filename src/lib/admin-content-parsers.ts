import { parseJson } from "@/lib/section-content";

export type BrandJson = { name: string; imageUrl: string };
export type PhotoJson = { imageUrl: string; caption?: string };
export type FaqJson = { q: string; a: string };
export type TestimonialJson = { quote: string; author: string };
export type ArticleJson = { title: string; excerpt: string; url: string };

export function parseBrand(val: string): BrandJson {
  return parseJson<BrandJson>(val, { name: "", imageUrl: "" });
}

export function parsePhoto(val: string): PhotoJson {
  return parseJson<PhotoJson>(val, { imageUrl: "", caption: "" });
}

export function parseFaq(val: string): FaqJson {
  return parseJson<FaqJson>(val, { q: "", a: "" });
}

export function parseTestimonial(val: string): TestimonialJson {
  return parseJson<TestimonialJson>(val, { quote: "", author: "" });
}

export function parseArticle(val: string): ArticleJson {
  return parseJson<ArticleJson>(val, {
    title: "",
    excerpt: "",
    url: "",
  });
}
