import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const contentSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1),
  value: z.string().min(1),
  valueType: z.enum(["TEXT", "MARKDOWN", "JSON", "IMAGE_URL", "URL"]),
  sortOrder: z.number().int(),
});

const sectionSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  slug: z.string().min(2),
  enabled: z.boolean(),
  order: z.number().int(),
  title: z.string().optional().default(""),
  subtitle: z.string().optional().default(""),
  description: z.string().optional().default(""),
  contents: z.array(contentSchema),
});

const payloadSchema = z.object({
  sections: z.array(sectionSchema),
});

export async function PUT(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());

    await prisma.$transaction(async (tx) => {
      for (const section of payload.sections) {
        await tx.section.update({
          where: { id: section.id },
          data: {
            name: section.name,
            slug: section.slug,
            enabled: section.enabled,
            order: section.order,
            title: section.title || null,
            subtitle: section.subtitle || null,
            description: section.description || null,
          },
        });

        await tx.content.deleteMany({ where: { sectionId: section.id } });
        if (section.contents.length) {
          await tx.content.createMany({
            data: section.contents.map((content) => ({
              sectionId: section.id,
              key: content.key,
              value: content.value,
              valueType: content.valueType,
              sortOrder: content.sortOrder,
            })),
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
}
