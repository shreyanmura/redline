"use client";
import { motion } from "framer-motion";
import { DayPoint } from "@/lib/demoData";
import { Reveal } from "./ui/Reveal";

const W = 760, H = 300, PL = 16, PR = 16, PT = 24, PB = 36;
const iw = W - PL - PR, ih = H - PT - PB;

export default function PredictiveChart({ data }: { data: DayPoint[] }) {
  const n = data.length;
  const x = (i: number) => PL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => PT + ih - (v / 100) * ih;
  const toLine = (key: "peak" | "avg") =>
    data.map((d, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(" ");
  const peakLine = toLine("peak");
  const area = `${peakLine} L ${x(n - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;
  const last = data[n - 1];

  return (
    <div className="py-24">
      <Reveal>
        <div className="label text-rl-red/80">Trend</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Predictive maintenance</h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/50">
          The engine was warming up for days before today&apos;s redline.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 rounded-3xl border border-line bg-panel/50 p-4 sm:p-6">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <linearGradient id="pm-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff3b30" stopOpacity="0.22" />
                <stop offset="1" stopColor="#ff3b30" stopOpacity="0" />
              </linearGradient>
              <filter id="pm-glow"><feGaussianBlur stdDeviation="4" /></filter>
            </defs>

            {[0, 50, 100].map((g) => (
              <g key={g}>
                <line x1={PL} y1={y(g)} x2={W - PR} y2={y(g)} stroke="rgba(255,255,255,0.05)" />
              </g>
            ))}
            {/* redline threshold */}
            <line x1={PL} y1={y(80)} x2={W - PR} y2={y(80)} stroke="#ff3b30" strokeOpacity="0.4" strokeDasharray="2 6" />

            <motion.path
              d={area}
              fill="url(#pm-fill)"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.6 }}
            />
            {/* avg dashed */}
            <motion.path
              d={toLine("avg")}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1.5}
              strokeDasharray="3 5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
            {/* peak solid */}
            <motion.path
              d={peakLine}
              fill="none"
              stroke="#ff453a"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
            {/* final glowing point */}
            <motion.circle
              cx={x(n - 1)} cy={y(last.peak)} r={9} fill="#ff3b30" filter="url(#pm-glow)" opacity={0.5}
              initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
              transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
            />
            <motion.circle
              cx={x(n - 1)} cy={y(last.peak)} r={4.5} fill="#fff"
              initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
              transition={{ delay: 1.6, type: "spring", stiffness: 240 }}
            />

            {data.map((d, i) => (
              <text key={i} x={x(i)} y={H - 12} textAnchor="middle" fontSize={11}
                fill={i === n - 1 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)"}
                fontWeight={i === n - 1 ? 600 : 400}>
                {d.label}
              </text>
            ))}
          </svg>
        </div>
      </Reveal>
    </div>
  );
}
