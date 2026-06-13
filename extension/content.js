/*
 * content.js — runs on every page. Captures keystroke TIMING (never content),
 * drives the floating gauge, fires real-time nudges, and on toggle-off builds a
 * session summary and asks the background worker for an AI debrief.
 */
(function () {
  const { createTracker, ZONES } = window.RedlineFeatures;

  let enabled = false;
  let tracker = null;
  let baseline = null;
  let intervalId = null;
  let redlineSince = null;
  let lastNudgeAt = 0;
  let nudgeIdx = 0;

  const REALTIME_TIPS = [
    "You've been redlining — unclench your jaw, drop your shoulders, take one slow breath.",
    "Engine's running hot. 20-second reset: look away from the screen and exhale slowly.",
    "High load for a while now. Try a 4-7-8 breath: in for 4, hold 7, out for 8.",
    "Lots of revving. Stand up, roll your shoulders, then ease back in.",
  ];

  const now = () => performance.now();

  function isEditable(t) {
    if (!t) return false;
    const tag = t.tagName;
    if (tag === "TEXTAREA") return true;
    if (tag === "INPUT") {
      const type = (t.type || "").toLowerCase();
      return ["text", "search", "email", "url", "tel", "password", "number", ""].includes(type);
    }
    return !!t.isContentEditable;
  }

  // Decide whether a keydown is a "typing" event and whether it's a correction.
  function classify(e) {
    const k = e.key;
    if (k === "Backspace" || k === "Delete") return { count: true, bs: true };
    if (k === "Enter" || k === " " || k === "Spacebar") return { count: true, bs: false };
    if (k.length === 1 && !e.ctrlKey && !e.metaKey) return { count: true, bs: false };
    return { count: false, bs: false };
  }

  function onKeyDown(e) {
    if (!enabled || !tracker) return;
    if (!isEditable(e.target)) return;
    const c = classify(e);
    if (!c.count) return;
    tracker.record(c.bs, now());
  }

  function tickLoop() {
    if (!tracker) return;
    const score = tracker.tick(now());
    window.RedlineWidget.update(score);

    // Sustained-redline -> real-time nudge (local, instant, no network).
    if (score >= ZONES.REDLINE) {
      if (redlineSince === null) redlineSince = now();
      const sustained = now() - redlineSince > 4000;
      const cooled = now() - lastNudgeAt > 25000;
      if (sustained && cooled) {
        window.RedlineWidget.showNudge(REALTIME_TIPS[nudgeIdx % REALTIME_TIPS.length]);
        nudgeIdx++;
        lastNudgeAt = now();
      }
    } else {
      redlineSince = null;
    }
  }

  function startSession() {
    tracker = createTracker(baseline);
    redlineSince = null;
    lastNudgeAt = 0;
    window.RedlineWidget.mount();
    window.RedlineWidget.setActive(true);
    window.RedlineWidget.hideNudge();
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(tickLoop, 150);
  }

  function endSession() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    window.RedlineWidget.setActive(false);
    if (!tracker) return;

    const summary = tracker.getSummary(now());
    tracker = null;

    // Only debrief if there was a real session.
    if (summary.keystrokes < 12) return;

    // Persist the session for the dashboard.
    chrome.runtime.sendMessage({ type: "saveSession", summary });

    // Show the debrief card immediately in a loading state, then fill it from
    // the AI coach (falls back to a local debrief if the coach is unreachable).
    window.RedlineWidget.showDebrief({ title: "Session debrief", summary, loading: true });
    chrome.runtime.sendMessage({ type: "coachDebrief", summary }, (resp) => {
      const text = (resp && resp.text) || localDebrief(summary);
      window.RedlineWidget.updateDebriefBody(text);
    });
  }

  // Offline fallback so the debrief never shows an error on stage.
  function localDebrief(s) {
    const hot = s.peakLoad >= ZONES.REDLINE;
    const lead = hot
      ? `That was a heavy stretch — you peaked at ${s.peakLoad} and spent ${s.redlineSeconds}s in the redline, mostly from ${s.dominantSignal}.`
      : `Solid session — you stayed mostly in the green (peak ${s.peakLoad}).`;
    return (
      lead +
      "\n\nTo wind down: step away from the screen for a bit, take a short walk to reset, " +
      "and go easy on social media tonight. Spend some time with family or friends, " +
      "drink some water, and aim for an earlier night. You don't have to run at 100% to be enough."
    );
  }

  // React to popup toggle / calibration writes.
  function applyState(state) {
    const wasEnabled = enabled;
    enabled = !!state.enabled;
    baseline = state.baseline || null;
    if (enabled && !wasEnabled) startSession();
    else if (!enabled && wasEnabled) endSession();
  }

  chrome.storage.local.get(["enabled", "baseline"], applyState);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    chrome.storage.local.get(["enabled", "baseline"], applyState);
  });

  document.addEventListener("keydown", onKeyDown, true);
})();
