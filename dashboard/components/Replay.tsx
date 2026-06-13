"use client";
import { useEffect, useRef, useState } from "react";
import { TimePoint } from "@/lib/demoData";
import { loadColor } from "@/lib/theme";
import { Reveal } from "./ui/Reveal";

export default function Replay({ data }: { data: TimePoint[] }) {
  const pts = data.length ? data : [{ sec: 0, load: 0 }];
  const n = pts.length;
  const maxSec = Math.max(1, pts[n - 1].sec);
  const useMin = maxSec > 120;
  const fmt = (s: number) => (useMin ? `${Math.round(s / 60)}m` : `${Math.round(s)}s`);

  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const raf = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function play() {
    if (playing) {
      setPlaying(false);
      cancelAnimationFrame(raf.current);
      return;
    }
    setPlaying(true);
    const start = progress >= 1 ? 0 : progress;
    const dur = 4200;
    const t0 = performance.now() - start * dur;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setProgress(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(tick);
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const headIdx = Math.min(n - 1, Math.round(progress * (n - 1)));
  const activeIdx = hover != null ? hover : headIdx;
  const cur = pts[activeIdx];
  const xpct = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * 100);

  const peakIdx = pts.reduce((m, p, i) => (p.load > pts[m].load ? i : m), 0);
  const crossIdx = pts.findIndex((p) => p.load >= 80);
  let recoveryIdx = -1;
  for (let i = peakIdx; i < n; i++) if (pts[i].load < 65) { recoveryIdx = i; break; }
  const markers = [
    crossIdx >= 0 ? { i: crossIdx, label: "Redline crossed", color: "#ff3b30" } : null,
    { i: peakIdx, label: "Peak", color: "#ff9f0a" },
    recoveryIdx >= 0 ? { i: recoveryIdx, label: "Recovery", color: "#30d158" } : null,
  ].filter(Boolean) as { i: number; label: string; color: string }[];

  function onMove(e: React.MouseEvent) {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setHover(Math.round(f * (n - 1)));
  }

  return (
    <div className="py-24">
      <Reveal>
        <div className="label text-rl-red/80">Replay</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Scrub the session</h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/50">
          A play-by-play of your typing load — hover the waveform to read any moment.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 rounded-3xl border border-line bg-panel/50 p-6 sm:p-8">
          {/* transport */}
          <div className="flex items-center gap-5">
            <button
              onClick={play}
              className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <div className="flex items-baseline gap-3">
              <span className="num text-5xl leading-none" style={{ color: loadColor(cur.load) }}>{Math.round(cur.load)}</span>
              <div className="leading-tight">
                <div className="label">load at {fmt(cur.sec)}</div>
                <div className="mt-1 text-[15px] text-white/40">{hover != null ? "hovering" : playing ? "playing" : "paused"}</div>
              </div>
            </div>
          </div>

          {/* waveform */}
          <div className="relative mt-10 pt-6">
            {/* markers */}
            {markers.map((m) => (
              <div key={m.label} className="absolute top-0 z-10 -translate-x-1/2" style={{ left: `${xpct(m.i)}%` }}>
                <div className="whitespace-nowrap text-[13px] font-medium" style={{ color: m.color }}>{m.label}</div>
                <div className="mx-auto mt-0.5 h-1.5 w-1.5 rounded-full" style={{ background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
              </div>
            ))}

            <div
              ref={containerRef}
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
              className="relative flex h-40 items-end gap-[2px]"
            >
              {pts.map((p, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-[2px] transition-opacity duration-150"
                  style={{
                    height: `${Math.max(4, p.load)}%`,
                    background: loadColor(p.load),
                    opacity: i <= headIdx ? 1 : 0.22,
                  }}
                />
              ))}
              {/* playhead */}
              <div className="pointer-events-none absolute bottom-0 top-0 w-px bg-white/80" style={{ left: `${progress * 100}%` }} />
              {/* hover tooltip */}
              {hover != null && (
                <div
                  className="pointer-events-none absolute -top-9 -translate-x-1/2 rounded-lg border border-line bg-ink2/90 px-2.5 py-1 text-[14px] backdrop-blur"
                  style={{ left: `${xpct(hover)}%` }}
                >
                  <span className="text-white/50">{fmt(pts[hover].sec)}</span>{" "}
                  <span style={{ color: loadColor(pts[hover].load) }}>{Math.round(pts[hover].load)}</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-between text-[14px] text-white/30">
              <span>{fmt(0)}</span>
              <span>{fmt(maxSec)}</span>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
