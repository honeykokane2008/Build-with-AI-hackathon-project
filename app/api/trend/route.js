import { NextResponse } from "next/server";
import { buildTrend } from "@/lib/recommend";

export async function GET() {
  return NextResponse.json({ trend: buildTrend() });
}
