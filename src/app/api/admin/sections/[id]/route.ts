import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ADMIN_PAGE_CACHE_TAG, LANDING_CACHE_TAG } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    await prisma.section.delete({
      where: { id: context.params.id },
    });
    revalidateTag(LANDING_CACHE_TAG);
    revalidateTag(ADMIN_PAGE_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus section." }, { status: 400 });
  }
}
