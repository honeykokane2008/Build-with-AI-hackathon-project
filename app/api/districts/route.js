import { NextResponse } from "next/server";
import { getAllRegions } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ regions: getAllRegions() });
}
