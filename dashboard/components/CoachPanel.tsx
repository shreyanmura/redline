"use client";
import { useState } from "react";
import { SessionSummary } from "@/lib/types";

export default function CoachPanel({ summary }: { summary: SessionSummary }) {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>("");

  async function getDebrief() {
    setLoading(true);
    try {
      const threadId =
        typeof window !== "undefined" ? localStorage.getItem("redline-thread") || undefined : undefined;
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "debrief", summary, threadId }),
      });
      const data = await res.json();
      setText(data.text || "");
      setSource(data.source || "");
      if (data.threadId && typeof window !== "undefined") {
        localStorage.setItem("redline-thread", data.threadId);
      }
    } catch {
      setText("Couldn't reach the coach just now — but be kind to yourself tonight: step away from the screen, take a walk, and go easy on the socials.");
      setSource("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="coach">
      <div className="coach-head">
        <div className="coach-avatar">◠</div>
        <div>
          <div className="coach-name">Redline Coach</div>
          <div className="coach-sub">end-of-session debrief · powered by Backboard</div>
        </div>
        {source && (
          <span className={`tag ${source === "backboard" ? "tag-live" : ""}`}>
            {source === "backboard" ? "live" : source === "local" ? "offline" : source}
          </span>
        )}
      </div>

      {text ? (
        <p className="coach-body">{text}</p>
      ) : (
        <p className="coach-empty">
          When you flip the toggle off, Redline sends your session summary here and the
          coach reflects on how it went — plus a few low-effort ways to wind down your day.
        </p>
      )}

      <button className="coach-btn" onClick={getDebrief} disabled={loading}>
        {loading ? "Thinking through your session…" : text ? "Regenerate debrief" : "Get tonight's debrief"}
      </button>
    </div>
  );
}
