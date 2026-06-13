"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { TimePoint } from "@/lib/demoData";
import { loadColor } from "@/lib/theme";
import { Reveal } from "./ui/Reveal";

const W = 760, H = 300, PL = 16, PR = 16, PT = 28, PB = 34;
const iw = W - PL - PR, ih = H - PT - PB;

export default function TonightReplay({ data }: { data: TimePoint[] }) {
  const pts = data.length ? data : [{ sec: 0, load: 0 }];
  const n = pts.length;
  const maxSec = Math.max(1, pts[n - 1].sec);
  const useMin = maxSec > 120;
  const fmt = (s: number) => (useMin ? `${Math.round(s / 60)}m` : `${Math.round(s)}s`);
  const x = (sec: number) => PL + (sec / maxSec) * iw;
  const y = (v: number) => PT + ih - (v / 100) * ih;

  const line = pts.map((p, i) => `${i ? "L" : "M"} ${x(p.sec).toFixed(1)} ${y(p.load).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(maxSec)} ${y(0)} L ${x(0)} ${y(0)} Z`;
  const crossIdx = pts.findIndex((p) => p.load >= 80);
  const cross = crossIdx >= 0 ? pts[crossIdx] : null;

  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setHover(Math.round(f * (n - 1)));
  }
  const hp = hover != null ? pts[hover] : null;

  return (
    <div className="py-24">
      <Reveal>
        <div className="label text-rl-red/80">Tonight</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Tonight&apos;s replay</h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/50">
          Stress climbs through the session — and the moment it crossed the line.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="relative mt-10 rounded-3xl border border-line bg-panel/50 p-4 sm:p-6">
          <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
            <defs>
              <linearGradient id="tr-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff9f0a" stopOpacity="0.25" />
                <stop offset="1" stopColor="#ff9f0a" stopOpacity="0" />
              </linearGradient>
              <filter id="tr-glow"><feGaussianBlur stdDeviation="5" /></filter>
            </defs>

            <line x1={PL} y1={y(80)} x2={W - PR} y2={y(80)} stroke="#ff3b30" strokeOpacity="0.4" strokeDasharray="2 6" />
            <text x={PL + 2} y={y(80) - 6} fontSize={10} fill="#ff6961" letterSpacing="1">REDLINE</text>

            <motion.path d={area} fill="url(#tr-fill)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.5 }} />
            <motion.path
              d={line} fill="none" stroke="#ffb340" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: "easeInOut" }}
            />

            {cross && (
              <g>
                <circle cx={x(cross.sec)} cy={y(cross.load)} r={7} fill="#ff3b30" filter="url(#tr-glow)" />
                <circle cx={x(cross.sec)} cy={y(cross.load)} r={7} fill="none" stroke="#ff3b30" strokeWidth={2}>
                  <animate attributeName="r" values="7;18;7" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <text x={x(cross.sec)} y={y(cross.load) - 22} textAnchor="middle" fontSize={11} fontWeight={600} fill="#ff6961">
                  REDLINE crossed · {fmt(cross.sec)}
                </text>
              </g>
            )}

            {/* hover guide */}
            {hp && (
              <g>
                <line x1={x(hp.sec)} y1={PT} x2={x(hp.sec)} y2={PT + ih} stroke="rgba(255,255,255,0.25)" />
                <circle cx={x(hp.sec)} cy={y(hp.load)} r={4} fill="#fff" />
              </g>
            )}

            {[0, maxSec / 2, maxSec].map((s, i) => (
              <text key={i} x={x(s)} y={H - 10} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.35)">{fmt(s)}</text>
            ))}
          </svg>

          {hp && (
            <div className="pointer-events-none absolute left-6 top-6 rounded-lg border border-line bg-ink2/90 px-3 py-1.5 text-[15px] backdrop-blur">
              <span className="text-white/50">{fmt(hp.sec)}</span> · <span style={{ color: loadColor(hp.load) }}>{Math.round(hp.load)} load</span>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
