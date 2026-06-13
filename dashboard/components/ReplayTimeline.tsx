"use client";
import { useEffect, useState } from "react";
import { TimePoint } from "@/lib/demoData";
import { ZONES } from "@/lib/types";

const W = 700, H = 200, PAD_L = 30, PAD_R = 16, PAD_T = 14, PAD_B = 26;
const innerW = W - PAD_L - PAD_R;
const innerH = H - PAD_T - PAD_B;

export default function ReplayTimeline({ data }: { data: TimePoint[] }) {
  const pts = data.length ? data : [{ sec: 0, load: 0 }];
  const maxSec = Math.max(1, pts[pts.length - 1].sec);
  const useMin = maxSec > 120;
  const fmt = (sec: number) => (useMin ? `${Math.round(sec / 60)}m` : `${Math.round(sec)}s`);
  const x = (sec: number) => PAD_L + (sec / maxSec) * innerW;
  const y = (v: number) => PAD_T + innerH - (v / 100) * innerH;

  // "Replay" head that sweeps across on mount to dramatize the spiral.
  const [head, setHead] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const dur = 2600;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setHead(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data]);

  const line = pts.map((p, i) => `${i ? "L" : "M"} ${x(p.sec).toFixed(1)} ${y(p.load).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(maxSec)} ${y(0)} L ${x(0)} ${y(0)} Z`;

  const crossIdx = pts.findIndex((p) => p.load >= ZONES.REDLINE);
  const cross = crossIdx >= 0 ? pts[crossIdx] : null;
  const headX = PAD_L + head * innerW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ display: "block" }}>
      <defs>
        <linearGradient id="rt-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
        <clipPath id="rt-clip"><rect x={0} y={0} width={headX} height={H} /></clipPath>
      </defs>

      <line x1={PAD_L} y1={y(ZONES.REDLINE)} x2={W - PAD_R} y2={y(ZONES.REDLINE)}
        stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" opacity={0.55} />
      <text x={PAD_L + 2} y={y(ZONES.REDLINE) - 4} fontSize={8} fill="#f87171" letterSpacing={1}>REDLINE</text>

      <g clipPath="url(#rt-clip)">
        <path d={area} fill="url(#rt-fill)" />
        <path d={line} fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeLinejoin="round" />
      </g>

      {cross && head > crossIdx / pts.length && (
        <g>
          <circle cx={x(cross.sec)} cy={y(cross.load)} r={6} fill="#ef4444" />
          <circle cx={x(cross.sec)} cy={y(cross.load)} r={11} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.5}>
            <animate attributeName="r" values="6;14;6" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <text x={x(cross.sec)} y={y(cross.load) - 16} textAnchor="middle" fontSize={9} fill="#fca5a5">
            crossed into redline · {fmt(cross.sec)}
          </text>
        </g>
      )}

      <line x1={headX} y1={PAD_T} x2={headX} y2={H - PAD_B} stroke="#e5e7eb" strokeWidth={1} opacity={0.4} />

      {[0, maxSec / 2, maxSec].map((s, i) => (
        <text key={i} x={x(s)} y={H - 8} textAnchor="middle" fontSize={9} fill="#64748b">{fmt(s)}</text>
      ))}
    </svg>
  );
}
