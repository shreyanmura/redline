"use client";
import { motion } from "framer-motion";
import { loadColor, loadState, EASE } from "@/lib/theme";

export default function StatusBlock({ value }: { value: number }) {
  const s = loadState(value);
  const c = loadColor(value);
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="label">Engine load · current state</div>
      <motion.div
        key={s.label}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative mt-4 text-5xl font-semibold tracking-tight sm:text-6xl"
        style={{ color: c }}
      >
        {s.label}
        <motion.span
          className="absolute -bottom-3 left-1/2 h-[3px] -translate-x-1/2 rounded-full"
          style={{ background: c, boxShadow: `0 0 18px ${c}` }}
          initial={{ width: 0 }}
          whileInView={{ width: "72%" }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        />
      </motion.div>
      <p className="mt-8 max-w-sm text-[15px] leading-relaxed text-white/50">{s.msg}</p>
    </div>
  );
}
