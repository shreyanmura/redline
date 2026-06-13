"use client";
import { zoneColor, ZONES } from "@/lib/types";

const SWEEP = 270;
const A0 = -135;
const angleFor = (s: number) => A0 + (Math.max(0, Math.min(100, s)) / 100) * SWEEP;

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function arc(cx: number, cy: number, r: number, t0: number, t1: number): string {
  const [x0, y0] = polar(cx, cy, r, angleFor(t0));
  const [x1, y1] = polar(cx, cy, r, angleFor(t1));
  const large = angleFor(t1) - angleFor(t0) > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export default function Tachometer({ score, size = 300 }: { score: number; size?: number }) {
  const cx = 100, cy = 104, r = 78;
  const color = zoneColor(score);
  const redlining = score >= ZONES.REDLINE;
  const ticks = [];
  for (let s = 0; s <= 100; s += 10) {
    const [ix, iy] = polar(cx, cy, r - 12, angleFor(s));
    const [ox, oy] = polar(cx, cy, r - 4, angleFor(s));
    ticks.push(
      <line key={s} x1={ix} y1={iy} x2={ox} y2={oy} stroke="#64748b" strokeWidth={s % 20 === 0 ? 2 : 1} />
    );
  }
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
      <defs>
        <filter id="tg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="zg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#16a34a" /><stop offset="1" stopColor="#4ade80" />
        </linearGradient>
        <linearGradient id="za" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d97706" /><stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="zr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dc2626" /><stop offset="1" stopColor="#f87171" />
        </linearGradient>
      </defs>

      <path d={arc(cx, cy, r, 0, 100)} fill="none" stroke="#1f2530" strokeWidth={14} strokeLinecap="round" />
      <path d={arc(cx, cy, r, 0, 45)} fill="none" stroke="url(#zg)" strokeWidth={14} opacity={0.9} />
      <path d={arc(cx, cy, r, 45, 78)} fill="none" stroke="url(#za)" strokeWidth={14} opacity={0.9} />
      <path d={arc(cx, cy, r, 78, 100)} fill="none" stroke="url(#zr)" strokeWidth={14} opacity={redlining ? 1 : 0.9} />
      {ticks}

      <polygon
        points="100,104 97,104 100,30 103,104"
        fill={color}
        filter="url(#tg)"
        style={{
          transformBox: "view-box",
          transformOrigin: "100px 104px",
          transform: `rotate(${angleFor(score)}deg)`,
          transition: "transform 600ms cubic-bezier(.22,1,.36,1)",
        }}
      />
      <circle cx={cx} cy={cy} r={7} fill="#0b0e14" stroke="#94a3b8" strokeWidth={2} />

      <text x={100} y={150} textAnchor="middle" fontFamily="ui-monospace, Menlo, monospace"
        fontSize={32} fontWeight={800} fill={color}>{Math.round(score)}</text>
      <text x={100} y={168} textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize={9} letterSpacing={2} fill="#64748b">ENGINE LOAD</text>
      <text x={100} y={181} textAnchor="middle" fontFamily="ui-monospace, Menlo, monospace"
        fontSize={9} letterSpacing={1} fill="#94a3b8">( 0 – 100 )</text>
    </svg>
  );
}
