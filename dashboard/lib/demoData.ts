import { SessionSummary } from "./types";

// Realistic seed data so the dashboard tells a full story even before any live
// session has been recorded. Live sessions from the extension are merged on top.

export type DayPoint = { label: string; peak: number; avg: number };
export type TimePoint = { sec: number; load: number };

// Last 7 days — a quietly worsening week that culminates in today's redline.
// (Classic "the system was running hot for days before the crisis" arc.)
export const WEEK: DayPoint[] = [
  { label: "Sat", peak: 38, avg: 22 },
  { label: "Sun", peak: 31, avg: 19 },
  { label: "Mon", peak: 52, avg: 34 },
  { label: "Tue", peak: 61, avg: 41 },
  { label: "Wed", peak: 58, avg: 39 },
  { label: "Thu", peak: 74, avg: 49 },
  { label: "Today", peak: 91, avg: 63 },
];

// Tonight's session — the needle climbing into the redline while writing.
// A steady-ish start, then a stress spiral around the 22-32 minute mark.
const TONIGHT_LOADS = [
  18, 22, 20, 27, 31, 29, 36, 44, 41, 49, 58, 67, 79, 86, 91, 88, 82, 71, 64, 57, 49,
];
export const TONIGHT: TimePoint[] = TONIGHT_LOADS.map((load, i) => ({ sec: i * 120, load }));

export const DEMO_SUMMARY: SessionSummary = {
  peakLoad: 91,
  currentLoad: 49,
  avgLoad: 52,
  durationSec: 40 * 60,
  keystrokes: 1840,
  avgWpm: 71,
  redlineSeconds: 6 * 60,
  dominantSignal: "frequent corrections / backspacing",
  contributions: { speed: 46, errors: 22, rhythm: 16, hesitation: 9 },
  series: TONIGHT_LOADS,
  hadBaseline: true,
};

// Feature breakdown at peak (for the radar / bars). 0-100 each.
export const SIGNALS = [
  { key: "Rhythm", value: 88 },
  { key: "Corrections", value: 92 },
  { key: "Hesitation", value: 68 },
  { key: "Pace", value: 74 },
];
