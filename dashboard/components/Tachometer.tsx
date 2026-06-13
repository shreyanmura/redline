"use client";
import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useSpring, useTransform } from "framer-motion";
import { loadColor } from "@/lib/theme";

const SWEEP = 270;
const A0 = -135;
const CX = 180;
const CY = 196;
const R = 132;

const angleFor = (v: number) => A0 + (Math.max(0, Math.min(100, v)) / 100) * SWEEP;
function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}
function arc(r: number, t0: number, t1: number) {
  const [x0, y0] = polar(r, angleFor(t0));
  const [x1, y1] = polar(r, angleFor(t1));
  const large = angleFor(t1) - angleFor(t0) > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export default function Tachometer({ value }: { value: number }) {
  // start at 0 so the needle sweeps up to the value on first paint
  const sv = useSpring(0, { stiffness: 70, damping: 16, mass: 0.7 });
  useEffect(() => {
    sv.set(value);
  }, [value, sv]);

  const [shown, setShown] = useState(0);
  useMotionValueEvent(sv, "change", (v) => setShown(Math.round(v)));

  const progress = useTransform(sv, (v) => Math.max(0, Math.min(100, v)) / 100);
  const tipX = useTransform(sv, (v) => polar(R - 16, angleFor(v))[0]);
  const tipY = useTransform(sv, (v) => polar(R - 16, angleFor(v))[1]);

  const color = loadColor(shown);
  const ticks = [];
  for (let i = 0; i <= 100; i += 5) {
    const [ix, iy] = polar(R - 20, angleFor(i));
    const [ox, oy] = polar(R - 12, angleFor(i));
    ticks.push(
      <line key={i} x1={ix} y1={iy} x2={ox} y2={oy} stroke="rgba(255,255,255,0.14)" strokeWidth={i % 25 === 0 ? 2 : 1} />
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      {/* ambient zone glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full blur-3xl"
        animate={{ backgroundColor: color, opacity: 0.1 + (shown / 100) * 0.32 }}
        transition={{ duration: 0.6 }}
      />
      <svg viewBox="0 0 360 360" className="relative w-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="rl-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#30d158" />
            <stop offset="0.42" stopColor="#ffd60a" />
            <stop offset="0.64" stopColor="#ff9f0a" />
            <stop offset="0.82" stopColor="#ff3b30" />
            <stop offset="1" stopColor="#ff3b30" />
          </linearGradient>
          <filter id="rl-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* base track */}
        <path d={arc(R, 0, 100)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={16} strokeLinecap="round" />
        {ticks}

        {/* progress arc */}
        <motion.path
          d={arc(R, 0, 100)}
          fill="none"
          stroke="url(#rl-arc)"
          strokeWidth={16}
          strokeLinecap="round"
          filter="url(#rl-soft)"
          style={{ pathLength: progress }}
        />

        {/* needle + glowing tip */}
        <motion.line x1={CX} y1={CY} x2={tipX} y2={tipY} stroke={color} strokeWidth={3} strokeLinecap="round" filter="url(#rl-soft)" />
        <motion.circle cx={tipX} cy={tipY} r={6} fill={color} filter="url(#rl-soft)" />
        <circle cx={CX} cy={CY} r={10} fill="#0c0c0c" stroke="rgba(255,255,255,0.18)" strokeWidth={2} />

        {/* numeric */}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize={84} fontWeight={700} fill="#fff" className="num" style={{ letterSpacing: "-0.04em" }}>
          {shown}
        </text>
        <text x={CX} y={CY + 28} textAnchor="middle" fontSize={14} fill="rgba(255,255,255,0.4)" letterSpacing="3" fontWeight={600}>
          ENGINE LOAD
        </text>
        <text x={CX} y={CY + 47} textAnchor="middle" fontSize={14} fill="rgba(255,255,255,0.28)" letterSpacing="1" fontFamily="ui-monospace, monospace">
          ( 0 – 100 )
        </text>
        <text x={CX} y={CY + 70} textAnchor="middle" fontSize={13} fill={color} letterSpacing="3" fontWeight={700} opacity={0.85}>
          SESSION MAX
        </text>
      </svg>
    </div>
  );
}
