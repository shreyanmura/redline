"use client";
import { motion } from "framer-motion";
import { EASE } from "@/lib/theme";
import { Reveal } from "./ui/Reveal";

const FACTORS = [
  {
    key: "Pace",
    max: 62,
    color: "#ff3b30",
    desc: "Measures typing speed relative to your own calm baseline. Sudden acceleration or slowdown can indicate rising cognitive load.",
  },
  {
    key: "Corrections",
    max: 24,
    color: "#ff9f0a",
    desc: "Based on backspaces over total keystrokes. More corrections often reflect uncertainty or increased mental effort.",
  },
  {
    key: "Rhythm",
    max: 18,
    color: "#ffd60a",
    desc: "Captures how irregular your typing cadence becomes. Higher variability suggests disrupted cognitive flow.",
  },
  {
    key: "Hesitation",
    max: 14,
    color: "#30d158",
    desc: "The proportion of short, hesitant pauses while typing — a quiet signal of uncertainty or overload.",
  },
];

const FORMULA = [
  { t: "load", c: "text-white/40" },
  { t: "=", c: "text-white/30" },
  { t: "Pace", c: "text-rl-red" },
  { t: "×62", c: "text-white/40" },
  { t: "+", c: "text-white/30" },
  { t: "Corrections", c: "text-rl-orange" },
  { t: "×24", c: "text-white/40" },
  { t: "+", c: "text-white/30" },
  { t: "Rhythm", c: "text-rl-yellow" },
  { t: "×18", c: "text-white/40" },
  { t: "+", c: "text-white/30" },
  { t: "Hesitation", c: "text-rl-green" },
  { t: "×14", c: "text-white/40" },
];

export default function HowCalculated() {
  return (
    <div className="py-24">
      <Reveal>
        <div className="label text-rl-red/80">The Index</div>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          How engine load is calculated
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/50">
          A 0–100 index — like an air-quality or credit score — that blends four research-backed
          typing signals measured against your own calm baseline. Higher means more strain. It&apos;s an
          early signal, not a diagnosis.
        </p>
      </Reveal>

      {/* formula */}
      <Reveal delay={0.1}>
        <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-ink2/60 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-lg sm:text-2xl">
            {FORMULA.map((f, i) => (
              <motion.span
                key={i}
                className={f.c}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.04 * i, ease: EASE }}
              >
                {f.t}
              </motion.span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[13px] text-white/35">
            <span>→ summed</span>
            <span>→ capped at 100</span>
            <span>→ smoothed over time</span>
          </div>
        </div>
      </Reveal>

      {/* weighted contribution bars */}
      <div className="mt-8 grid gap-5">
        {FACTORS.map((f, i) => (
          <Reveal key={f.key} delay={0.05 * i}>
            <div className="rounded-2xl border border-line bg-panel/60 p-5 sm:p-6">
              <div className="flex items-baseline justify-between">
                <div className="text-lg font-medium">{f.key}</div>
                <div className="font-mono text-sm text-white/45">
                  max <span className="text-white/80">{f.max}</span>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: f.color, boxShadow: `0 0 16px -2px ${f.color}` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(f.max / 62) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: 0.15 + i * 0.08, ease: EASE }}
                />
              </div>
              <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-white/45">{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* callout */}
      <Reveal delay={0.1}>
        <div className="mt-8 flex items-start gap-4 rounded-2xl border border-rl-green/20 bg-rl-green/[0.04] p-6">
          <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-rl-green/15 text-rl-green">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-medium text-white">Why is my score low when I&apos;m calm?</div>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-white/50">
              Because every metric is compared against <span className="text-white/80">your personal baseline</span>,
              relaxed typing naturally stays near zero and sits in the green zone. The score reflects{" "}
              <span className="text-white/80">change from your normal</span> — not absolute typing speed.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
