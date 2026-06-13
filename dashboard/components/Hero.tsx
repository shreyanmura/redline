"use client";
import { motion } from "framer-motion";
import Tachometer from "./Tachometer";
import { EASE, loadState } from "@/lib/theme";

export default function Hero({
  value,
  connected,
  stale,
}: {
  value: number;
  connected: boolean;
  stale?: boolean;
}) {
  const state = loadState(value);
  const live = connected && !stale;
  const chipText = !connected
    ? "Sample data — connect the extension to go live"
    : stale
    ? "Reconnecting — refresh this tab to resync"
    : "Connected to your typing · live";
  const dotColor = live ? "bg-rl-green" : stale ? "bg-rl-yellow" : "bg-white/30";
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden pt-12">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade" />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1fr_1.05fr]">
        {/* left */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="flex items-center gap-2 text-[15px] text-white/45"
          >
            <span className="relative flex h-2 w-2">
              {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rl-green/60" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
            </span>
            {chipText}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.05, ease: EASE }}
            className="mt-5 text-6xl font-semibold leading-[0.95] tracking-tight sm:text-7xl"
          >
            REDLINE
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.13, ease: EASE }}
            className="mt-4 text-xl text-white/80 sm:text-2xl"
          >
            A tachometer for your mental load.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.22, ease: EASE }}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-white/50 text-balance"
          >
            Your keyboard rhythm reveals subtle changes in cognitive load long before you
            consciously notice them.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.32, ease: EASE }}
            className="mt-9 flex items-center gap-3"
          >
            <span className="label">Status</span>
            <span className="h-3.5 w-px bg-line" />
            <span className="text-sm text-white/80">{state.label}</span>
          </motion.div>
        </div>

        {/* right — the centerpiece */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.1, ease: EASE }}
        >
          <Tachometer value={value} />
        </motion.div>
      </div>
    </section>
  );
}
