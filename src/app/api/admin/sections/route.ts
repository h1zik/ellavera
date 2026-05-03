import { SectionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const contentSchema = z.object({
  id: z.string().optional(),
  key: z.string(),
  value: z.string(),
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

const createSectionSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: z.nativeEnum(SectionType),
  order: z.number().int(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = createSectionSchema.parse(await request.json());
    const section = await prisma.section.create({
      data: {
        name: body.name,
        slug: body.slug,
        type: body.type,
        order: body.order,
        enabled: true,
        title: body.title ?? null,
        subtitle: body.subtitle ?? null,
        description: body.description ?? null,
      },
      include: { contents: true },
    });
    return NextResponse.json(section);
  } catch {
    return NextResponse.json(
      { error: "Gagal membuat section (cek slug unik & format)." },
      { status: 400 },
    );
  }
}

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

        const contentsToSave = section.contents.filter(
          (c) => c.key.trim().length > 0 && c.value.trim().length > 0,
        );

        await tx.content.deleteMany({ where: { sectionId: section.id } });
        if (contentsToSave.length) {
          await tx.content.createMany({
            data: contentsToSave.map((content) => ({
              sectionId: section.id,
              key: content.key.trim(),
              value: content.value.trim(),
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
