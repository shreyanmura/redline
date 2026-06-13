"use client";
import { motion } from "framer-motion";

function Logo() {
  return (
    <span
      className="block h-7 w-7 rounded-[9px] ring-1 ring-white/10"
      style={{
        background: "conic-gradient(from 210deg, #30d158, #ffd60a 45%, #ff3b30 72%, #30d158)",
        boxShadow: "0 0 16px -2px rgba(255,59,48,0.45), inset 0 0 0 4px #0c0c0c",
      }}
    />
  );
}

export default function Nav() {
  const links = ["History", "Settings", "About"];
  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-4 z-50 px-4"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-line bg-ink2/60 px-4 py-2.5 backdrop-blur-2xl sm:px-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[13px] font-semibold tracking-[0.22em]">REDLINE</span>
        </div>
        <nav className="flex items-center gap-5 text-[13px] sm:gap-7">
          {links.map((l) => (
            <a key={l} href="#" className="hidden text-white/55 transition-colors hover:text-white sm:inline">
              {l}
            </a>
          ))}
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-rl-orange to-rl-red ring-1 ring-white/15" />
        </nav>
      </div>
    </motion.header>
  );
}
