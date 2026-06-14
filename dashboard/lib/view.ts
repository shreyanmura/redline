import { SessionSummary, Contributions, Baseline } from "./types";
import {
  DayPoint,
  TimePoint,
  WEEK as DEMO_WEEK,
  TONIGHT as DEMO_TONIGHT,
  SIGNALS as DEMO_SIGNALS,
  DEMO_SUMMARY,
} from "./demoData";

export type View = {
  isLive: boolean;
  summary: SessionSummary;
  baseline: Baseline | null;
  week: DayPoint[];
  tonight: TimePoint[];
  signals: { key: string; value: number }[];
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Max possible value of each contribution in features.js scoreFrom(), so we can
// normalize each signal bar to 0-100.
const CONTRIB_MAX = { speed: 62, errors: 24, rhythm: 18, hesitation: 14 };

function contribToSignals(c?: Contributions) {
  if (!c) return DEMO_SIGNALS;
  const pct = (v: number, max: number) => Math.min(100, Math.max(0, Math.round((v / max) * 100)));
  return [
    { key: "Pace", value: pct(c.speed, CONTRIB_MAX.speed) },
    { key: "Corrections", value: pct(c.errors, CONTRIB_MAX.errors) },
    { key: "Rhythm", value: pct(c.rhythm, CONTRIB_MAX.rhythm) },
    { key: "Hesitation", value: pct(c.hesitation, CONTRIB_MAX.hesitation) },
  ];
}

function buildWeek(sessions: SessionSummary[]): DayPoint[] {
  const now = new Date();
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days.map((d, idx) => {
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const inDay = sessions.filter(
      (s) => s.endedAt && s.endedAt >= d.getTime() && s.endedAt < next.getTime()
    );
    const peak = inDay.reduce((m, s) => Math.max(m, s.peakLoad || 0), 0);
    const avg = inDay.length
      ? Math.round(inDay.reduce((a, s) => a + (s.avgLoad ?? s.currentLoad ?? 0), 0) / inDay.length)
      : 0;
    return { label: idx === 6 ? "Today" : DAY_LABELS[d.getDay()], peak, avg };
  });
}

// Series is sampled ~every 1.5s in content.js.
function seriesToTonight(series?: number[]): TimePoint[] {
  if (!series || !series.length) return [];
  return series.map((load, i) => ({ sec: i * 1.5, load }));
}

export function buildView(sessions: SessionSummary[] | null, baseline: Baseline | null): View {
  if (!sessions || sessions.length === 0) {
    return {
      isLive: false,
      summary: DEMO_SUMMARY,
      baseline,
      week: DEMO_WEEK,
      tonight: DEMO_TONIGHT,
      signals: DEMO_SIGNALS,
    };
  }
  const latest = sessions[sessions.length - 1];
  const tonight = seriesToTonight(latest.series);
  return {
    isLive: true,
    summary: latest,
    baseline,
    week: buildWeek(sessions),
    tonight: tonight.length >= 2 ? tonight : DEMO_TONIGHT,
    signals: contribToSignals(latest.contributions),
  };
}

export const DEMO_VIEW: View = buildView(null, null);

// Shown when the extension is connected but has no recorded sessions (fresh, or
// after a "Reset all activity"). Everything reads zero so the site matches the
// extension instead of silently falling back to the sample data.
export function emptyView(baseline: Baseline | null): View {
  return {
    isLive: true,
    baseline,
    summary: {
      peakLoad: 0,
      currentLoad: 0,
      avgLoad: 0,
      durationSec: 0,
      keystrokes: 0,
      avgWpm: 0,
      redlineSeconds: 0,
      dominantSignal: "No sessions yet",
      contributions: { speed: 0, errors: 0, rhythm: 0, hesitation: 0 },
      series: [],
      hadBaseline: !!baseline,
    },
    week: buildWeek([]),
    tonight: [],
    signals: [
      { key: "Pace", value: 0 },
      { key: "Corrections", value: 0 },
      { key: "Rhythm", value: 0 },
      { key: "Hesitation", value: 0 },
    ],
  };
}
