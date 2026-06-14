"use client";
import { useEffect, useRef, useState } from "react";
import PoweredBy from "@/components/PoweredBy";
import Hero from "@/components/Hero";
import StatusBlock from "@/components/StatusBlock";
import HowCalculated from "@/components/HowCalculated";
import SessionMetrics from "@/components/SessionMetrics";
import Replay from "@/components/Replay";
import PredictiveChart from "@/components/PredictiveChart";
import TonightReplay from "@/components/TonightReplay";
import WhatDroveLoad from "@/components/WhatDroveLoad";
import WhyTyping from "@/components/WhyTyping";
import Coach from "@/components/Coach";
import PrivacySection from "@/components/PrivacySection";
import { Container } from "@/components/ui/Container";
import { buildView, emptyView, DEMO_VIEW, View } from "@/lib/view";
import { SessionSummary, Baseline } from "@/lib/types";

export default function Page() {
  const [view, setView] = useState<View>(DEMO_VIEW);
  const [connected, setConnected] = useState(false);
  const [stale, setStale] = useState(false);
  const [score, setScore] = useState(DEMO_VIEW.summary.peakLoad);
  const sigRef = useRef("");
  const lastMsgRef = useRef(0);

  // Bridge: the extension's content script heartbeats recorded sessions here.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.source !== window) return;
      const d = e.data;
      if (d && d.__redline && d.type === "sessions") {
        lastMsgRef.current = Date.now();
        setConnected(true);
        setStale(false);
        const sessions = (d.sessions as SessionSummary[]) || [];
        const last = sessions[sessions.length - 1];
        const sig = `${sessions.length}:${last ? last.endedAt : 0}`;
        // only re-render when the data actually changed (heartbeats are frequent)
        if (sig !== sigRef.current) {
          sigRef.current = sig;
          const baseline = d.baseline as Baseline;
          // connected but empty (fresh / after reset) → explicit zeroed state,
          // not the sample data, so the site matches the extension
          setView(sessions.length ? buildView(sessions, baseline) : emptyView(baseline));
        }
      }
    }
    window.addEventListener("message", onMsg);

    const ping = () => window.postMessage({ __redline: true, type: "ready" }, "*");
    const onFocus = () => ping();
    const onVis = () => { if (!document.hidden) ping(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    ping();
    const pollId = window.setInterval(ping, 2000);

    // if no heartbeat for a while, the bridge is likely orphaned → flag stale
    const staleId = window.setInterval(() => {
      if (lastMsgRef.current && Date.now() - lastMsgRef.current > 6000) setStale(true);
    }, 2000);

    return () => {
      window.removeEventListener("message", onMsg);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(pollId);
      clearInterval(staleId);
    };
  }, []);

  useEffect(() => {
    // hero gauge shows the session's PEAK load (highest reached), not the
    // ending value — which is what the dashboard is reviewing.
    setScore(view.summary.peakLoad);
  }, [view]);

  return (
    <main className="relative">
      <PoweredBy />
      <Hero value={score} connected={connected} stale={stale} />

      <Container>
        <StatusBlock value={score} />
        <div className="hairline" />
        {/* first graphic after the hero */}
        <WhyTyping />
        <div className="hairline" />
        {/* breakdown + session metrics, sitting above the index */}
        <WhatDroveLoad signals={view.signals} />
        <SessionMetrics summary={view.summary} />
        <div className="hairline" />
        <HowCalculated />
        <div className="hairline" />
        <Replay data={view.tonight} />
        <div className="hairline" />
        <PredictiveChart data={view.week} />
        <div className="hairline" />
        <TonightReplay data={view.tonight} />
        <div className="hairline" />
        <Coach summary={view.summary} />
        <PrivacySection />
      </Container>
    </main>
  );
}
