"use client";
import { DayPoint } from "@/lib/demoData";
import { ZONES } from "@/lib/types";

const W = 700, H = 240, PAD_L = 34, PAD_R = 16, PAD_T = 16, PAD_B = 28;
const innerW = W - PAD_L - PAD_R;
const innerH = H - PAD_T - PAD_B;

const x = (i: number, n: number) => PAD_L + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
const y = (v: number) => PAD_T + innerH - (v / 100) * innerH;

export default function TrendChart({ data }: { data: DayPoint[] }) {
  const n = data.length;
  const peakPts = data.map((d, i) => [x(i, n), y(d.peak)] as const);
  const avgPts = data.map((d, i) => [x(i, n), y(d.avg)] as const);
  const line = (pts: readonly (readonly [number, number])[]) =>
    pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line(peakPts)} L ${x(n - 1, n)} ${y(0)} L ${x(0, n)} ${y(0)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ display: "block" }}>
      <defs>
        <linearGradient id="ta-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* zone bands */}
      <rect x={PAD_L} y={y(100)} width={innerW} height={y(ZONES.AMBER_MAX) - y(100)} fill="#ef4444" opacity="0.06" />
      <rect x={PAD_L} y={y(ZONES.AMBER_MAX)} width={innerW} height={y(ZONES.GREEN_MAX) - y(ZONES.AMBER_MAX)} fill="#f59e0b" opacity="0.05" />
      <rect x={PAD_L} y={y(ZONES.GREEN_MAX)} width={innerW} height={y(0) - y(ZONES.GREEN_MAX)} fill="#22c55e" opacity="0.05" />

      {/* gridlines + y labels */}
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={PAD_L} y1={y(g)} x2={W - PAD_R} y2={y(g)} stroke="#1f2733" strokeWidth={1} />
          <text x={PAD_L - 8} y={y(g) + 3} textAnchor="end" fontSize={9} fill="#475569">{g}</text>
        </g>
      ))}

      {/* redline threshold */}
      <line x1={PAD_L} y1={y(ZONES.REDLINE)} x2={W - PAD_R} y2={y(ZONES.REDLINE)}
        stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
      <text x={W - PAD_R} y={y(ZONES.REDLINE) - 4} textAnchor="end" fontSize={8} fill="#f87171" letterSpacing={1}>REDLINE</text>

      <path d={area} fill="url(#ta-fill)" />
      <path d={line(avgPts)} fill="none" stroke="#475569" strokeWidth={1.5} strokeDasharray="3 3" />
      <path d={line(peakPts)} fill="none" stroke="#f87171" strokeWidth={2.5} strokeLinejoin="round" />

      {peakPts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === n - 1 ? 5 : 3}
          fill={i === n - 1 ? "#f87171" : "#0a0d13"} stroke="#f87171" strokeWidth={2} />
      ))}

      {data.map((d, i) => (
        <text key={i} x={x(i, n)} y={H - 8} textAnchor="middle" fontSize={9.5}
          fill={i === n - 1 ? "#e5e7eb" : "#64748b"} fontWeight={i === n - 1 ? 700 : 400}>
          {d.label}
        </text>
      ))}
    </svg>
  );
}
