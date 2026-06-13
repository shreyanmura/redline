/*
 * features.js — Redline keystroke-dynamics scoring engine (responsive rewrite).
 *
 * PRIVACY: we never read the character typed — only a timestamp + a single
 * "was it a backspace" boolean. Everything is derived from TIMING.
 *
 * The gauge shows ENGINE LOAD = how hard you're driving (pace) + stress signals.
 *   - base load tracks your *instantaneous* typing cadence (last few keystrokes),
 *     so speeding up revs it up and slowing down drops it — fast and responsive.
 *   - corrections (backspacing), erratic rhythm (bursty), and many brief hesitant
 *     pauses add on top and push you into the redline.
 * With a personal baseline, "pace" is measured relative to YOUR calm speed.
 *
 * Exposed as a global (content scripts share one isolated world):
 *   window.RedlineFeatures = { createTracker, baselineFromEvents, ZONES }
 */
(function () {
  const WINDOW_MS = 6000; // window for stress metrics (shorter = more responsive)
  const SPEED_SAMPLES = 8; // recent intervals used for instantaneous pace
  const PAUSE_MS = 1500; // gap above this = a long pause (not a hesitation)
  const HESITATE_LO = 350; // brief hesitant pauses live in [350ms, 1500ms]
  const EMA_ALPHA = 0.3; // needle smoothing (higher = snappier)
  const REDLINE = 78;

  const ZONES = { GREEN_MAX: 45, AMBER_MAX: 78, REDLINE };

  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const clamp01 = (x) => clamp(x, 0, 1);
  const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const std = (a, m) => (a.length ? Math.sqrt(avg(a.map((x) => (x - m) * (x - m)))) : 0);
  const band = (v, lo, hi) => clamp01((v - lo) / (hi - lo));
  function median(a) {
    if (!a.length) return 0;
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function createTracker(baseline) {
    let events = []; // [{ t, bs }]
    let emaScore = 0;
    let peak = 0;
    let redlineMs = 0;
    let startedAt = null;
    let lastTickAt = null;
    let totalKeys = 0;
    let totalChars = 0; // non-backspace keys, for WPM
    let scoreSum = 0;
    let scoreTicks = 0;
    let contribAccum = { speed: 0, errors: 0, rhythm: 0, hesitation: 0 };
    let contribTicks = 0;

    function prune(now) {
      const cutoff = now - WINDOW_MS;
      while (events.length && events[0].t < cutoff) events.shift();
    }

    function record(isBackspace, t) {
      if (startedAt === null) startedAt = t;
      events.push({ t, bs: !!isBackspace });
      totalKeys++;
      if (!isBackspace) totalChars++;
      prune(t);
    }

    function metrics(now) {
      prune(now);
      if (events.length < 3) return null;
      const ts = events.map((e) => e.t);
      const ikis = [];
      for (let i = 1; i < ts.length; i++) ikis.push(ts[i] - ts[i - 1]);

      // instantaneous pace = median of the most recent intervals
      const recent = ikis.slice(-SPEED_SAMPLES);
      const medIki = median(recent);
      const kpm = medIki > 0 ? 60000 / medIki : 0; // keystrokes per minute, right now

      const m = avg(ikis);
      const sd = std(ikis, m);
      const cv = m > 0 ? sd / m : 0; // rhythm irregularity / burstiness
      const bsRate = events.filter((e) => e.bs).length / events.length;
      const hesRate = ikis.filter((x) => x > HESITATE_LO && x <= PAUSE_MS).length / ikis.length;
      return { kpm, cv, bsRate, hesRate };
    }

    function scoreFrom(m) {
      // Base load from pace. With a baseline, measured vs YOUR calm speed.
      let lo = 140, hi = 480; // kpm, no-baseline defaults (~28..96 wpm)
      if (baseline && baseline.kpm > 0) {
        lo = baseline.kpm * 1.0;
        hi = baseline.kpm * 2.4;
      }
      const speed = band(m.kpm, lo, hi) * 62; // 0..62, dominant + responsive
      const errors = band(m.bsRate, 0.02, 0.25) * 24; // corrections
      const rhythm = band(m.cv, 0.5, 1.3) * 18; // erratic bursts
      const hesitation = band(m.hesRate, 0.1, 0.5) * 14; // brief hesitant pauses

      const contributions = { speed, errors, rhythm, hesitation };
      const raw = speed + errors + rhythm + hesitation;
      return { score: Math.round(clamp(raw, 0, 100)), contributions };
    }

    function tick(now) {
      const m = metrics(now);
      let target = 0;
      let contributions = null;
      if (m) {
        const r = scoreFrom(m);
        target = r.score;
        contributions = r.contributions;
      }
      emaScore = emaScore + EMA_ALPHA * (target - emaScore);
      const score = Math.round(emaScore);

      if (lastTickAt !== null && score >= REDLINE) redlineMs += now - lastTickAt;
      lastTickAt = now;
      if (score > peak) peak = score;
      scoreSum += score;
      scoreTicks++;
      if (contributions) {
        contribAccum.speed += contributions.speed;
        contribAccum.errors += contributions.errors;
        contribAccum.rhythm += contributions.rhythm;
        contribAccum.hesitation += contributions.hesitation;
        contribTicks++;
      }
      return score;
    }

    function getScore() {
      return Math.round(emaScore);
    }

    function avgContributions() {
      const n = contribTicks || 1;
      return {
        speed: Math.round(contribAccum.speed / n),
        errors: Math.round(contribAccum.errors / n),
        rhythm: Math.round(contribAccum.rhythm / n),
        hesitation: Math.round(contribAccum.hesitation / n),
      };
    }

    function getSummary(now) {
      const durationSec = startedAt !== null ? Math.round((now - startedAt) / 1000) : 0;
      const minutes = durationSec / 60;
      const avgWpm = minutes > 0 ? Math.round(totalChars / 5 / minutes) : 0;

      const labels = {
        speed: "a fast, driving pace",
        errors: "frequent corrections / backspacing",
        rhythm: "erratic typing rhythm",
        hesitation: "lots of brief, hesitant pauses",
      };
      const c = avgContributions();
      let dominant = "speed", best = -1;
      for (const k of Object.keys(c)) if (c[k] > best) { best = c[k]; dominant = k; }

      return {
        peakLoad: peak,
        currentLoad: getScore(),
        avgLoad: scoreTicks ? Math.round(scoreSum / scoreTicks) : 0,
        durationSec,
        keystrokes: totalKeys,
        avgWpm,
        redlineSeconds: Math.round(redlineMs / 1000),
        dominantSignal: labels[dominant],
        contributions: c,
        hadBaseline: !!baseline,
      };
    }

    function reset() {
      events = [];
      emaScore = 0; peak = 0; redlineMs = 0;
      startedAt = null; lastTickAt = null;
      totalKeys = 0; totalChars = 0;
      scoreSum = 0; scoreTicks = 0;
      contribAccum = { speed: 0, errors: 0, rhythm: 0, hesitation: 0 };
      contribTicks = 0;
    }

    return { record, tick, getScore, getSummary, reset };
  }

  // Build a calm baseline from a calibration sample of raw {t, bs} events.
  function baselineFromEvents(rawEvents) {
    if (!rawEvents || rawEvents.length < 8) return null;
    const ts = rawEvents.map((e) => e.t);
    const ikis = [];
    for (let i = 1; i < ts.length; i++) ikis.push(ts[i] - ts[i - 1]);
    const m = avg(ikis);
    const sd = std(ikis, m);
    const cv = m > 0 ? sd / m : 0.5;
    const medIki = median(ikis);
    const kpm = medIki > 0 ? 60000 / medIki : 200;
    const bsRate = rawEvents.filter((e) => e.bs).length / rawEvents.length;
    const chars = rawEvents.filter((e) => !e.bs).length;
    const durMin = (ts[ts.length - 1] - ts[0]) / 60000;
    const wpm = durMin > 0 ? Math.round(chars / 5 / durMin) : 0;
    return { kpm, cv, bsRate, wpm };
  }

  window.RedlineFeatures = { createTracker, baselineFromEvents, ZONES };
})();
