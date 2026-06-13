"use client";
import { useEffect, useRef, useState } from "react";
import Tachometer from "@/components/Tachometer";
import TrendChart from "@/components/TrendChart";
import ReplayTimeline from "@/components/ReplayTimeline";
import CoachPanel from "@/components/CoachPanel";
import { zoneColor, ZONES, SessionSummary, Baseline } from "@/lib/types";
import { buildView, DEMO_VIEW, View } from "@/lib/view";

function statusText(s: number) {
  if (s >= ZONES.REDLINE) return ["Redline", "ease off — your system is running hot"];
  if (s >= ZONES.GREEN_MAX) return ["Revving", "load is climbing — worth a check-in"];
  return ["Idle", "running cool — nice and steady"];
}

export default function Page() {
  const [view, setView] = useState<View>(DEMO_VIEW);
  const [connected, setConnected] = useState(false);
  const [score, setScore] = useState(DEMO_VIEW.summary.currentLoad);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // When live data arrives, reset the gauge to the latest session.
  useEffect(() => {
    setScore(view.summary.currentLoad);
  }, [view]);

  const [label, sub] = statusText(score);
  const summary = view.summary;
  const mins = Math.round(summary.durationSec / 60);

  function replay() {
    if (timer.current) clearInterval(timer.current);
    const loads = view.tonight.map((p) => p.load);
    if (!loads.length) return;
    let i = 0;
    timer.current = setInterval(() => {
      if (i >= loads.length) {
        clearInterval(timer.current!);
        setScore(summary.currentLoad);
        return;
      }
      setScore(loads[i]);
      i++;
    }, 240);
  }

  const chip = !connected
    ? "sample data — install the extension to go live"
    : view.isLive
    ? `live · ${view.week.reduce((n, d) => n + (d.peak > 0 ? 1 : 0), 0)} active days`
    : "extension connected · record a session to populate";

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo" />
          <div>
            <div className="name">REDLINE</div>
            <div className="tag">a tachometer for your mental load</div>
          </div>
        </div>
        <div className="live-chip">
          <span className="live-dot" style={{ background: connected ? "#22c55e" : "#64748b", boxShadow: connected ? "0 0 8px #22c55e" : "none" }} />
          {chip}
        </div>
      </header>

      {/* hero */}
      <div className="grid cols-hero">
        <div className="card gauge-card">
          <Tachometer score={score} size={300} />
          <div className="gauge-status">
            <b style={{ color: zoneColor(score) }}>{label}</b> — {sub}
          </div>
          <button className="btn primary" onClick={replay}>▶ Replay {view.isLive ? "last session" : "tonight's session"}</button>
        </div>

        <div className="stat-grid">
          <div className="tile">
            <div className="num" style={{ color: zoneColor(summary.peakLoad) }}>{summary.peakLoad}</div>
            <div className="lbl">peak load</div>
          </div>
          <div className="tile">
            <div className="num">{summary.avgWpm ?? "—"}</div>
            <div className="lbl">session wpm</div>
          </div>
          <div className="tile">
            <div className="num">{summary.redlineSeconds < 60 ? `${summary.redlineSeconds}s` : `${Math.floor(summary.redlineSeconds / 60)}m`}</div>
            <div className="lbl">time in redline</div>
          </div>
          <div className="tile">
            <div className="num" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{summary.dominantSignal}</div>
            <div className="lbl signal">dominant stress signal</div>
          </div>
        </div>
      </div>

      {/* weekly trend */}
      <div className="card section-gap">
        <h2>Predictive maintenance · last 7 days</h2>
        <div className="hint">Peak daily load (solid) vs. average (dashed). The engine warms up over days before a redline.</div>
        <TrendChart data={view.week} />
      </div>

      {/* tonight replay + signal breakdown */}
      <div className="grid cols-2 section-gap">
        <div className="card">
          <h2>{view.isLive ? "Last session · replay" : "Tonight's replay · making the spiral visible"}</h2>
          <div className="hint">A play-by-play of the writing session and the moment load crossed the redline.</div>
          <ReplayTimeline data={view.tonight} />
        </div>
        <div className="card">
          <h2>What drove the load</h2>
          <div className="hint">Contribution of each keystroke-dynamics signal during the session.</div>
          <div className="bars">
            {view.signals.map((s) => (
              <div className="bar-row" key={s.key}>
                <span className="k">{s.key}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: `${s.value}%`, background: zoneColor(s.value) }} />
                </span>
                <span className="v">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="callout" style={{ marginTop: 18 }}>
            <b>Why typing?</b> Under stress your rhythm gets erratic, corrections spike, and your pace
            drifts off-baseline — <b>racing</b> on adrenaline or <b>stalling</b> under mental overload —
            with many short, hesitant pauses. In studies this predicts strain better than heart rate, and
            it's <b>passive</b>: no survey to fill out when you're already spiraling.
          </div>
        </div>
      </div>

      {/* coach */}
      <div className="card section-gap">
        <CoachPanel summary={summary} />
      </div>

      <footer className="footer">
        <span><span className="lock">🔒</span> Timing metadata only — never the words you type. Scoring runs on your device.</span>
        <span>Redline · Milpitas Hacks · The Pressure Valve</span>
      </footer>
    </div>
  );
}
