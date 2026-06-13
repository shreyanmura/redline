"use client";
import { useRef, useState } from "react";
import Tachometer from "@/components/Tachometer";
import TrendChart from "@/components/TrendChart";
import ReplayTimeline from "@/components/ReplayTimeline";
import CoachPanel from "@/components/CoachPanel";
import { WEEK, TONIGHT, SIGNALS, DEMO_SUMMARY } from "@/lib/demoData";
import { zoneColor, ZONES } from "@/lib/types";

function statusText(s: number) {
  if (s >= ZONES.REDLINE) return ["Redline", "ease off — your system is running hot"];
  if (s >= ZONES.GREEN_MAX) return ["Revving", "load is climbing — worth a check-in"];
  return ["Idle", "running cool — nice and steady"];
}

export default function Page() {
  const [score, setScore] = useState(DEMO_SUMMARY.currentLoad);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [label, sub] = statusText(score);

  function replay() {
    if (timer.current) clearInterval(timer.current);
    let i = 0;
    timer.current = setInterval(() => {
      if (i >= TONIGHT.length) {
        clearInterval(timer.current!);
        setScore(DEMO_SUMMARY.currentLoad);
        return;
      }
      setScore(TONIGHT[i].load);
      i++;
    }, 240);
  }

  const mins = Math.round(DEMO_SUMMARY.durationSec / 60);

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
        <div className="live-chip"><span className="live-dot" /> connected to your typing</div>
      </header>

      {/* hero */}
      <div className="grid cols-hero">
        <div className="card gauge-card">
          <Tachometer score={score} size={300} />
          <div className="gauge-status">
            <b style={{ color: zoneColor(score) }}>{label}</b> — {sub}
          </div>
          <button className="btn primary" onClick={replay}>▶ Replay tonight's session</button>
        </div>

        <div className="stat-grid">
          <div className="tile">
            <div className="num" style={{ color: zoneColor(DEMO_SUMMARY.peakLoad) }}>{DEMO_SUMMARY.peakLoad}</div>
            <div className="lbl">peak load today</div>
          </div>
          <div className="tile">
            <div className="num">{Math.floor(DEMO_SUMMARY.redlineSeconds / 60)}m</div>
            <div className="lbl">time in redline</div>
          </div>
          <div className="tile">
            <div className="num">{mins}m</div>
            <div className="lbl">session length</div>
          </div>
          <div className="tile">
            <div className="num" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{DEMO_SUMMARY.dominantSignal}</div>
            <div className="lbl signal">dominant stress signal</div>
          </div>
        </div>
      </div>

      {/* weekly trend */}
      <div className="card section-gap">
        <h2>Predictive maintenance · last 7 days</h2>
        <div className="hint">Peak daily load (solid) vs. average (dashed). The engine was warming up for days before today's redline.</div>
        <TrendChart data={WEEK} />
      </div>

      {/* tonight replay + signal breakdown */}
      <div className="grid cols-2 section-gap">
        <div className="card">
          <h2>Tonight's replay · making the spiral visible</h2>
          <div className="hint">A play-by-play of this evening's writing session and the moment load crossed the redline.</div>
          <ReplayTimeline data={TONIGHT} />
        </div>
        <div className="card">
          <h2>What drove the load</h2>
          <div className="hint">Contribution of each keystroke-dynamics signal at peak.</div>
          <div className="bars">
            {SIGNALS.map((s) => (
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
        <CoachPanel summary={DEMO_SUMMARY} />
      </div>

      <footer className="footer">
        <span><span className="lock">🔒</span> Timing metadata only — never the words you type. Scoring runs on your device.</span>
        <span>Redline · Milpitas Hacks · The Pressure Valve</span>
      </footer>
    </div>
  );
}
