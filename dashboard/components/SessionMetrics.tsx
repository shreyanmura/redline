"use client";
import { SessionSummary } from "@/lib/types";
import { loadColor } from "@/lib/theme";
import { CountUp } from "./ui/CountUp";
import { Reveal } from "./ui/Reveal";

export default function SessionMetrics({ summary }: { summary: SessionSummary }) {
  const redMin = summary.redlineSeconds >= 60;
  const items = [
    {
      label: "Peak load",
      node: <CountUp value={summary.peakLoad} />,
      color: loadColor(summary.peakLoad),
      sub: "of 100",
    },
    {
      label: "Time in redline",
      node: redMin ? (
        <>
          <CountUp value={Math.round(summary.redlineSeconds / 60)} />
          <span className="ml-1 text-2xl text-white/40">min</span>
        </>
      ) : (
        <>
          <CountUp value={summary.redlineSeconds} />
          <span className="ml-1 text-2xl text-white/40">s</span>
        </>
      ),
      color: "#fff",
      sub: "above 80",
    },
    {
      label: "Session length",
      node: (
        <>
          <CountUp value={Math.round(summary.durationSec / 60)} />
          <span className="ml-1 text-2xl text-white/40">min</span>
        </>
      ),
      color: "#fff",
      sub: `${summary.avgWpm ?? "—"} wpm avg`,
    },
    {
      label: "Dominant signal",
      node: <span className="text-2xl font-semibold leading-tight">{summary.dominantSignal}</span>,
      color: "#fff",
      sub: "drove the load",
      text: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
      {items.map((it, i) => (
        <Reveal key={it.label} delay={i * 0.08} className="bg-ink2/80">
          <div className="flex h-full flex-col justify-between p-6 sm:p-7">
            <div className="label">{it.label}</div>
            <div
              className="num mt-8 leading-none"
              style={{ color: it.color, fontSize: it.text ? undefined : "3.25rem" }}
            >
              {it.node}
            </div>
            <div className="mt-3 text-[15px] text-white/35">{it.sub}</div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
