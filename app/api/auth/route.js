import { NextResponse } from "next/server";

export async function POST(request) {
  const { passcode } = await request.json();
  const expected = process.env.DASHBOARD_PASSCODE;

  // If no passcode is configured, the dashboard is intentionally open —
  // documented in the README as a known gap to close before real deployment.
  if (!expected) {
    return NextResponse.json({ ok: true, gated: false });
  }

  if (passcode === expected) {
    return NextResponse.json({ ok: true, gated: true });
  }

  return NextResponse.json({ ok: false, gated: true }, { status: 401 });
}
