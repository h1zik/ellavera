import { NextResponse } from "next/server";
import { getLandingData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getLandingData();
  return NextResponse.json(data);
}
