"use client";
import { Reveal } from "./ui/Reveal";

export default function PrivacySection() {
  return (
    <div className="py-28">
      <Reveal>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-panel/60">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="10" width="16" height="11" rx="2.5" stroke="#fff" strokeWidth="1.6" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="15.5" r="1.6" fill="#fff" />
            </svg>
          </div>
          <h2 className="mt-7 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
            Your words never leave your device.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/50">
            We analyze typing timing — not content. Processing happens locally, and only timing
            metadata is used to estimate engine load.
          </p>
          <div className="mt-10 h-px w-24 bg-line" />
          <div className="mt-8 text-[15px] text-white/30">Redline · Milpitas Hacks · The Pressure Valve</div>
        </div>
      </Reveal>
    </div>
  );
}
