import { SessionSummary } from "./types";

// Realistic seed data so the dashboard tells a full story even before any live
// session has been recorded. Live sessions from the extension are merged on top.

export type DayPoint = { label: string; peak: number; avg: number };
export type TimePoint = { min: number; load: number };

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
export const TONIGHT: TimePoint[] = [
  { min: 0, load: 18 }, { min: 2, load: 22 }, { min: 4, load: 20 },
  { min: 6, load: 27 }, { min: 8, load: 31 }, { min: 10, load: 29 },
  { min: 12, load: 36 }, { min: 14, load: 44 }, { min: 16, load: 41 },
  { min: 18, load: 49 }, { min: 20, load: 58 }, { min: 22, load: 67 },
  { min: 24, load: 79 }, { min: 26, load: 86 }, { min: 28, load: 91 },
  { min: 30, load: 88 }, { min: 32, load: 82 }, { min: 34, load: 71 },
  { min: 36, load: 64 }, { min: 38, load: 57 }, { min: 40, load: 49 },
];

export const DEMO_SUMMARY: SessionSummary = {
  peakLoad: 91,
  currentLoad: 49,
  durationSec: 40 * 60,
  keystrokes: 1840,
  redlineSeconds: 6 * 60,
  dominantSignal: "frequent corrections / backspacing",
  hadBaseline: true,
};

// Feature breakdown at peak (for the radar / bars). 0-100 each.
export const SIGNALS = [
  { key: "Rhythm", value: 88 },
  { key: "Corrections", value: 92 },
  { key: "Hesitation", value: 68 },
  { key: "Pace", value: 74 },
];
