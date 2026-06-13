"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { SessionSummary } from "@/lib/types";
import { Reveal } from "./ui/Reveal";

export default function Coach({ summary }: { summary: SessionSummary }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [full, setFull] = useState("");
  const [shown, setShown] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");
  const fetched = useRef(false);
  const typer = useRef<number>(0);

  async function fetchDebrief() {
    setLoading(true);
    setFull("");
    setShown("");
    try {
      const threadId = typeof window !== "undefined" ? localStorage.getItem("redline-thread") || undefined : undefined;
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "debrief", summary, threadId }),
      });
      const data = await res.json();
      setSource(data.source || "");
      if (data.threadId && typeof window !== "undefined") localStorage.setItem("redline-thread", data.threadId);
      setFull(data.text || "");
    } catch {
      setSource("error");
      setFull("Couldn't reach the coach just now — but be kind to yourself tonight: step away from the screen, take a short walk, and go easy on social media.");
    } finally {
      setLoading(false);
    }
  }

  // auto-fetch once when scrolled into view
  useEffect(() => {
    if (inView && !fetched.current) {
      fetched.current = true;
      fetchDebrief();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  // typewriter streaming reveal
  useEffect(() => {
    if (!full) return;
    setShown("");
    let i = 0;
    clearInterval(typer.current);
    typer.current = window.setInterval(() => {
      i += 2;
      setShown(full.slice(0, i));
      if (i >= full.length) clearInterval(typer.current);
    }, 14);
    return () => clearInterval(typer.current);
  }, [full]);

  const streaming = loading || (full && shown.length < full.length);

  return (
    <div className="py-24" ref={ref}>
      <Reveal>
        <div className="overflow-hidden rounded-3xl border border-line bg-panel/60 shadow-panel">
          {/* header */}
          <div className="flex items-center gap-3 border-b border-line px-6 py-4 sm:px-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rl-orange/30 to-rl-red/30 text-rl-orange ring-1 ring-line">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" /></svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Redline Coach</div>
              <div className="text-[14px] text-white/40">end-of-session debrief · powered by Backboard</div>
            </div>
            <div className="flex items-center gap-1.5 text-[14px] text-white/50">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-rl-green"
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              live
            </div>
          </div>

          {/* message */}
          <div className="px-6 py-7 sm:px-8">
            <div className="flex gap-4">
              <div className="mt-1 hidden h-7 w-7 flex-none rounded-full bg-gradient-to-br from-rl-orange/40 to-rl-red/40 ring-1 ring-line sm:block" />
              <div className="min-h-[120px] flex-1">
                {!full && loading ? (
                  <div className="flex items-center gap-2 text-[15px] text-white/40">
                    <motion.span className="inline-block h-2 w-2 rounded-full bg-white/50" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                    thinking through your session…
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/80">
                    {shown}
                    {streaming && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-rl-red align-middle" />}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* footer / regenerate */}
          <div className="flex items-center justify-between border-t border-line px-6 py-4 sm:px-8">
            <div className="text-[14px] text-white/35">
              {source === "backboard" ? "generated live · remembers your history" : source === "local" ? "offline fallback" : ""}
            </div>
            <button
              onClick={fetchDebrief}
              disabled={loading}
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[16px] text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Regenerate
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
