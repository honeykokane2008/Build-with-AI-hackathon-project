import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommend";

export async function GET() {
  const recommendations = await getRecommendations(8);
  return NextResponse.json({ recommendations });
}
