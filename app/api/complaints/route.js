import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getAllComplaints, insertComplaint } from "@/lib/db";
import { classifyComplaint } from "@/lib/classify";
import { assignCluster } from "@/lib/dedup";
import { isRateLimited } from "@/lib/rateLimit";

export async function GET() {
  const complaints = getAllComplaints();
  return NextResponse.json({ complaints });
}

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions from this connection. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { text, channel, imageBase64, imageMimeType } = body;

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Complaint text is required" }, { status: 400 });
  }

  const classification = await classifyComplaint(
    text.trim(),
    imageBase64 || null,
    imageMimeType || null
  );

  const existing = getAllComplaints();
  const { clusterId: matchedClusterId, isDuplicate, similarity } = assignCluster(
    classification.translatedText || text,
    classification.regionId,
    classification.category,
    existing
  );

  const id = uuidv4();

  const complaint = {
    id,
    text: text.trim(),
    channel: channel || "text",
    hasPhoto: Boolean(imageBase64),
    createdAt: new Date().toISOString(),
    ...classification,
    clusterId: matchedClusterId || id,
    isDuplicate,
    similarityToCluster: similarity,
  };

  insertComplaint(complaint);

  return NextResponse.json({ complaint }, { status: 201 });
}
