import { NextRequest, NextResponse } from "next/server";
import { coachMessage } from "@/lib/backboard";
import { buildDebriefPrompt, localDebrief } from "@/lib/coachPrompt";
import { SessionSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Allow the browser extension (any origin) to call this route.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function POST(req: NextRequest) {
  let summary: SessionSummary;
  let threadId: string | undefined;
  try {
    const body = await req.json();
    summary = body.summary;
    threadId = body.threadId;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400, headers: CORS });
  }
  if (!summary) {
    return NextResponse.json({ error: "missing summary" }, { status: 400, headers: CORS });
  }

  const prompt = buildDebriefPrompt(summary);
  try {
    const { text, threadId: tid } = await coachMessage(prompt, threadId);
    const finalText = text && text.trim().length > 0 ? text : localDebrief(summary);
    return NextResponse.json({ text: finalText, threadId: tid, source: "backboard" }, { headers: CORS });
  } catch (e) {
    // Graceful fallback — the coach always says something useful.
    return NextResponse.json(
      { text: localDebrief(summary), threadId: null, source: "local" },
      { headers: CORS }
    );
  }
}
