// Mirrors the summary the extension produces in features.js -> getSummary().
export type Contributions = { speed: number; errors: number; rhythm: number; hesitation: number };

export type SessionSummary = {
  peakLoad: number;
  currentLoad: number;
  avgLoad?: number;
  durationSec: number;
  keystrokes: number;
  avgWpm?: number;
  redlineSeconds: number;
  dominantSignal: string;
  contributions?: Contributions;
  series?: number[]; // downsampled load timeline (~1 sample / 1.5s)
  hadBaseline: boolean;
  endedAt?: number;
};

export type Baseline = { kpm: number; cv: number; bsRate: number; wpm: number };

export const ZONES = { GREEN_MAX: 45, AMBER_MAX: 78, REDLINE: 78 };

export function zoneColor(score: number): string {
  if (score >= ZONES.REDLINE) return "#f87171";
  if (score >= ZONES.GREEN_MAX) return "#fbbf24";
  return "#4ade80";
}
