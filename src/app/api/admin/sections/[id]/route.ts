import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    await prisma.section.delete({
      where: { id: context.params.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus section." }, { status: 400 });
  }
}
