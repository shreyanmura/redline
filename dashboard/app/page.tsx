"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
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
import { buildView, DEMO_VIEW, View } from "@/lib/view";
import { SessionSummary, Baseline } from "@/lib/types";

export default function Page() {
  const [view, setView] = useState<View>(DEMO_VIEW);
  const [connected, setConnected] = useState(false);
  const [score, setScore] = useState(DEMO_VIEW.summary.currentLoad);

  // Bridge: the Redline extension's content script posts recorded sessions here.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.source !== window) return;
      const d = e.data;
      if (d && d.__redline && d.type === "sessions") {
        setConnected(true);
        setView(buildView(d.sessions as SessionSummary[], d.baseline as Baseline));
      }
    }
    window.addEventListener("message", onMsg);
    window.postMessage({ __redline: true, type: "ready" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    setScore(view.summary.currentLoad);
  }, [view]);

  return (
    <main className="relative">
      <Nav />
      <Hero value={score} connected={connected} />

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
