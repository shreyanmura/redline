"use client";
import { RadialGauge } from "./RadialGauge";
import { Reveal } from "./ui/Reveal";

export default function WhatDroveLoad({ signals }: { signals: { key: string; value: number }[] }) {
  return (
    <div className="py-24">
      <Reveal>
        <div className="label text-rl-red/80">Breakdown</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">What drove the load</h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/50">
          Each keystroke-dynamics signal&apos;s intensity during the session, 0–100.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 grid grid-cols-2 gap-y-10 rounded-3xl border border-line bg-panel/50 p-8 sm:p-14">
          {signals.map((s) => (
            <RadialGauge key={s.key} label={s.key} value={s.value} />
          ))}
        </div>
      </Reveal>
    </div>
  );
}
