import { NextRequest, NextResponse } from "next/server";
import { SessionSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// In-memory store — fine for a hackathon/local demo (single dev server process).
const sessions: SessionSummary[] = [];

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function GET() {
  return NextResponse.json({ sessions }, { headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const s: SessionSummary = body.summary || body;
    s.endedAt = s.endedAt || Date.now();
    sessions.push(s);
    if (sessions.length > 100) sessions.shift();
    return NextResponse.json({ ok: true, count: sessions.length }, { headers: CORS });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400, headers: CORS });
  }
}
