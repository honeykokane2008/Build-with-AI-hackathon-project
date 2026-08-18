import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getAllComplaints, insertComplaint } from "@/lib/db";
import { classifyComplaint } from "@/lib/classify";

export async function GET() {
  const complaints = getAllComplaints();
  return NextResponse.json({ complaints });
}

export async function POST(request) {
  const body = await request.json();
  const { text, channel } = body;

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Complaint text is required" }, { status: 400 });
  }

  const classification = await classifyComplaint(text.trim());

  const complaint = {
    id: uuidv4(),
    text: text.trim(),
    channel: channel || "text",
    createdAt: new Date().toISOString(),
    ...classification,
  };

  insertComplaint(complaint);

  return NextResponse.json({ complaint }, { status: 201 });
}
