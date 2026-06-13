// Mirrors the summary the extension produces in features.js -> getSummary().
export type SessionSummary = {
  peakLoad: number;
  currentLoad: number;
  durationSec: number;
  keystrokes: number;
  redlineSeconds: number;
  dominantSignal: string;
  hadBaseline: boolean;
  endedAt?: number;
};

export const ZONES = { GREEN_MAX: 45, AMBER_MAX: 78, REDLINE: 78 };

export function zoneColor(score: number): string {
  if (score >= ZONES.REDLINE) return "#f87171";
  if (score >= ZONES.GREEN_MAX) return "#fbbf24";
  return "#4ade80";
}
