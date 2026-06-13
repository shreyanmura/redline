"use client";
import { motion } from "framer-motion";
import { Reveal } from "./ui/Reveal";

function TypingViz() {
  const keys = Array.from({ length: 12 });
  const bars = Array.from({ length: 28 });
  return (
    <div className="relative flex h-full min-h-[340px] flex-col justify-center gap-10 overflow-hidden rounded-3xl border border-line bg-ink2/60 p-8">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade" />

      {/* keycaps pulsing — with an occasional red "correction" flash */}
      <div className="relative grid grid-cols-6 gap-2.5">
        {keys.map((_, i) => {
          const correction = i === 4 || i === 9;
          return (
            <motion.div
              key={i}
              className="aspect-square rounded-lg border border-line"
              animate={{
                backgroundColor: correction
                  ? ["rgba(255,255,255,0.04)", "rgba(255,59,48,0.5)", "rgba(255,255,255,0.04)"]
                  : ["rgba(255,255,255,0.03)", "rgba(255,255,255,0.14)", "rgba(255,255,255,0.03)"],
                scale: [1, correction ? 1.08 : 1.04, 1],
              }}
              transition={{
                duration: correction ? 2.4 : 1.6,
                repeat: Infinity,
                delay: (i % 6) * 0.12 + (i > 5 ? 0.3 : 0),
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>

      {/* rhythm equalizer */}
      <div className="relative flex h-16 items-end gap-1.5">
        {bars.map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm bg-gradient-to-t from-rl-red/70 to-rl-orange/80"
            animate={{ height: ["20%", `${30 + ((i * 37) % 70)}%`, "20%"] }}
            transition={{ duration: 1.1 + (i % 5) * 0.12, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative flex items-center gap-3 text-[14px] text-white/35">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rl-red" /> correction
        </span>
        <span className="flex items-center gap-1.5">
          <motion.span className="h-1.5 w-1.5 rounded-full bg-white/50" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.6, repeat: Infinity }} /> hesitation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-rl-orange/70" /> rhythm
        </span>
      </div>
    </div>
  );
}

export default function WhyTyping() {
  return (
    <div className="py-24">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <TypingViz />
        </Reveal>
        <Reveal delay={0.12}>
          <div>
            <div className="label text-rl-red/80">The science</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Why typing?</h2>
            <p className="mt-6 text-[16px] leading-relaxed text-white/60">
              Under stress, typing rhythm becomes less consistent, corrections increase, hesitation
              grows, and pace drifts away from baseline. Research suggests these passive behavioral
              signals often reveal cognitive strain earlier than self-reporting — or even heart-rate
              variability — without requiring surveys or wearables.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {["Passive", "No surveys", "No wearables", "On-device"].map((t) => (
                <span key={t} className="rounded-full border border-line px-3.5 py-1.5 text-[15px] text-white/55">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
