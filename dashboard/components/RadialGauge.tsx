"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CountUp } from "./ui/CountUp";
import { loadColor, EASE } from "@/lib/theme";

export function RadialGauge({ label, value }: { label: string; value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const color = loadColor(value);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative h-[150px] w-[150px]">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="58" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <motion.circle
            cx="75" cy="75" r="58" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            transform="rotate(-90 75 75)"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: value / 100 } : { pathLength: 0 }}
            transition={{ duration: 1.4, ease: EASE }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="num text-4xl" style={{ color }}>
            {inView ? <CountUp value={value} /> : 0}
          </span>
        </div>
      </div>
      <div className="label mt-4">{label}</div>
    </div>
  );
}
