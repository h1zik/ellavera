import { Content, Section, SiteSettings } from "@prisma/client";

export type SectionWithContents = Section & { contents: Content[] };

export type LandingData = {
  settings: SiteSettings;
  sections: SectionWithContents[];
};
