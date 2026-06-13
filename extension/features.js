/*
 * features.js — Redline keystroke-dynamics scoring engine.
 *
 * PRIVACY: we never read the character that was typed. We only record a
 * timestamp and a single boolean (was it a backspace/delete). Everything
 * below is derived from *timing*, not content.
 *
 * Research basis: under stress, typing rhythm becomes erratic (bursts then
 * abrupt pauses -> high coefficient of variation), error/backspace rate rises,
 * and pause structure changes. We blend those into a 0-100 "engine load".
 *
 * Exposed as a global (content scripts share one isolated world, no ES modules):
 *   window.RedlineFeatures = { createTracker, ZONES }
 */
(function () {
  const WINDOW_MS = 12000; // rolling analysis window
  const PAUSE_MS = 1500; // an inter-key gap longer than this counts as a "pause"
  const EMA_ALPHA = 0.2; // needle smoothing (higher = snappier, lower = calmer)
  const REDLINE = 78; // score at/above this = redline

  const ZONES = { GREEN_MAX: 45, AMBER_MAX: 78, REDLINE };

  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const std = (a, m) =>
    a.length ? Math.sqrt(avg(a.map((x) => (x - m) * (x - m)))) : 0;

  // Map one raw metric into a 0..1 "stress contribution" via a linear band.
  const band = (v, lo, hi) => clamp01((v - lo) / (hi - lo));

  // Pace stress is BIDIRECTIONAL. Acute stress (adrenaline/cortisol) can make you
  // race ("hurry sickness"); cognitive overload/fatigue can make you stall and
  // hunt for words. Either direction away from a calm pace raises load.
  function bidirectionalSpeed(cpm, baseline) {
    if (baseline && baseline.cpm > 0) {
      return clamp01(Math.abs(cpm - baseline.cpm) / (baseline.cpm * 0.6));
    }
    if (cpm < 180) return clamp01((180 - cpm) / 120); // stalling
    if (cpm > 320) return clamp01((cpm - 320) / 240); // racing
    return 0;
  }

  /*
   * createTracker(baseline?)
   *   baseline: optional { cv, bsRate, pauseRate, cpm } captured during a calm
   *             calibration sample. When present, we amplify deviations from
   *             the user's OWN normal instead of using absolute thresholds.
   *
   * Returns: { record, tick, getScore, getSummary, reset }
   */
  function createTracker(baseline) {
    let events = []; // [{ t, bs }]
    let emaScore = 0;
    let peak = 0;
    let redlineMs = 0;
    let startedAt = null;
    let lastTickAt = null;
    let totalKeys = 0;
    let contribAccum = { rhythm: 0, errors: 0, hesitation: 0, speed: 0 };
    let contribTicks = 0;

    function prune(now) {
      const cutoff = now - WINDOW_MS;
      while (events.length && events[0].t < cutoff) events.shift();
    }

    function record(isBackspace, t) {
      if (startedAt === null) startedAt = t;
      events.push({ t, bs: !!isBackspace });
      totalKeys++;
      prune(t);
    }

    // Derive raw timing metrics from the current window. null if too little data.
    function rawMetrics(now) {
      prune(now);
      if (events.length < 4) return null;
      const ts = events.map((e) => e.t);
      const ikis = [];
      for (let i = 1; i < ts.length; i++) ikis.push(ts[i] - ts[i - 1]);
      const m = avg(ikis);
      const sd = std(ikis, m);
      const cv = m > 0 ? sd / m : 0; // burstiness / rhythm irregularity
      const bsRate = events.filter((e) => e.bs).length / events.length;
      // Hesitation = MANY BRIEF pauses (350ms..1.5s). Research: stressed typists
      // take many short, hesitant pauses; relaxed typists take fewer, longer ones.
      const hesitationRate = ikis.filter((x) => x > 350 && x <= PAUSE_MS).length / ikis.length;
      const durSec = (ts[ts.length - 1] - ts[0]) / 1000;
      const cpm = durSec > 0 ? (events.length / durSec) * 60 : 0;
      return { cv, bsRate, hesitationRate, cpm };
    }

    // Convert metrics -> { score, contributions }. Pure function of metrics.
    function scoreFrom(m) {
      // Absolute bands tuned so calm typing ~15-30 and erratic/backspace-heavy
      // typing ~75-100.
      let rhythm = band(m.cv, 0.45, 1.25); // erratic bursts: steady ~0.5, frantic > 1.1
      let errors = band(m.bsRate, 0.02, 0.22); // corrections: calm ~3%, stressed > 18%
      let hesitation = band(m.hesitationRate, 0.08, 0.45); // many brief hesitant pauses
      let speed = bidirectionalSpeed(m.cpm, baseline); // racing OR stalling

      // If we have a personal baseline, blend in deviation-from-self so the
      // gauge reflects "off YOUR normal", not a universal threshold.
      if (baseline) {
        const dCv = band(m.cv, baseline.cv * 1.05, baseline.cv * 1.9 + 0.2);
        const dBs = band(m.bsRate, baseline.bsRate + 0.02, baseline.bsRate + 0.16);
        rhythm = 0.5 * rhythm + 0.5 * dCv;
        errors = 0.5 * errors + 0.5 * dBs;
      }

      const contributions = {
        rhythm: 0.32 * rhythm,
        errors: 0.3 * errors,
        hesitation: 0.2 * hesitation,
        speed: 0.18 * speed,
      };
      const raw =
        contributions.rhythm +
        contributions.errors +
        contributions.hesitation +
        contributions.speed;
      return { score: Math.round(clamp01(raw) * 100), contributions };
    }

    // Advance the EMA-smoothed needle. Call on each keystroke and on a timer so
    // the needle decays toward 0 when the user stops typing.
    function tick(now) {
      const m = rawMetrics(now);
      let target = 0;
      let contributions = null;
      if (m) {
        const r = scoreFrom(m);
        target = r.score;
        contributions = r.contributions;
      }
      emaScore = emaScore + EMA_ALPHA * (target - emaScore);
      const score = Math.round(emaScore);

      // Track session aggregates for the end-of-session debrief.
      if (lastTickAt !== null && score >= REDLINE) {
        redlineMs += now - lastTickAt;
      }
      lastTickAt = now;
      if (score > peak) peak = score;
      if (contributions) {
        contribAccum.rhythm += contributions.rhythm;
        contribAccum.errors += contributions.errors;
        contribAccum.hesitation += contributions.hesitation;
        contribAccum.speed += contributions.speed;
        contribTicks++;
      }
      return score;
    }

    function getScore() {
      return Math.round(emaScore);
    }

    // Summary used by the AI coach for the end-of-session debrief.
    function getSummary(now) {
      const durationSec = startedAt !== null ? Math.round((now - startedAt) / 1000) : 0;
      // Dominant stress signal = largest average contribution.
      let dominant = "rhythm";
      let best = -1;
      const labels = {
        rhythm: "erratic typing rhythm",
        errors: "frequent corrections / backspacing",
        hesitation: "lots of brief, hesitant pauses",
        speed: "an off-baseline pace (racing or stalling)",
      };
      for (const k of Object.keys(contribAccum)) {
        const v = contribTicks ? contribAccum[k] / contribTicks : 0;
        if (v > best) {
          best = v;
          dominant = k;
        }
      }
      return {
        peakLoad: peak,
        currentLoad: getScore(),
        durationSec,
        keystrokes: totalKeys,
        redlineSeconds: Math.round(redlineMs / 1000),
        dominantSignal: labels[dominant],
        hadBaseline: !!baseline,
      };
    }

    function reset() {
      events = [];
      emaScore = 0;
      peak = 0;
      redlineMs = 0;
      startedAt = null;
      lastTickAt = null;
      totalKeys = 0;
      contribAccum = { rhythm: 0, errors: 0, pauses: 0, speed: 0 };
      contribTicks = 0;
    }

    return { record, tick, getScore, getSummary, reset };
  }

  // Compute a calm baseline from a calibration sample of raw events.
  function baselineFromEvents(rawEvents) {
    if (!rawEvents || rawEvents.length < 8) return null;
    const ts = rawEvents.map((e) => e.t);
    const ikis = [];
    for (let i = 1; i < ts.length; i++) ikis.push(ts[i] - ts[i - 1]);
    const m = avg(ikis);
    const sd = std(ikis, m);
    const cv = m > 0 ? sd / m : 0.5;
    const bsRate = rawEvents.filter((e) => e.bs).length / rawEvents.length;
    const pauseRate = ikis.filter((x) => x > PAUSE_MS).length / ikis.length;
    const durSec = (ts[ts.length - 1] - ts[0]) / 1000;
    const cpm = durSec > 0 ? (rawEvents.length / durSec) * 60 : 200;
    return { cv, bsRate, pauseRate, cpm };
  }

  window.RedlineFeatures = { createTracker, baselineFromEvents, ZONES };
})();
