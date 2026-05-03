import { randomUUID } from "crypto";
import path from "path";
import { NextResponse } from "next/server";
import { getStorageBucketName, getSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function safeExt(mime: string, filename: string): string {
  const fromName = path.extname(filename).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(fromName)) {
    return fromName === ".jpeg" ? ".jpg" : fromName;
  }
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const bucket = getStorageBucketName();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Tidak ada file." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File terlalu besar (maks. 8 MB)." }, { status: 400 });
    }

    const ext = safeExt(file.type, file.name);
    const objectPath = `site/${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

    if (uploadError) {
      console.error("[upload] Supabase storage:", uploadError);
      return NextResponse.json(
        {
          error:
            "Gagal mengunggah ke Supabase. Pastikan bucket ada, nama di SUPABASE_STORAGE_BUCKET benar, dan bucket di-set publik (untuk URL publik) atau periksa log server.",
        },
        { status: 502 },
      );
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    const url = publicData.publicUrl;

    if (!url) {
      return NextResponse.json({ error: "Tidak bisa membuat URL publik." }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload gagal.";
    if (msg.includes("Supabase belum dikonfigurasi")) {
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    console.error("[upload]", e);
    return NextResponse.json({ error: "Upload gagal." }, { status: 500 });
  }
}
