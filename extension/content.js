/*
 * content.js — runs on every page.
 *
 * On the Redline dashboard (detected via a <meta name="redline-app">): acts as a
 * BRIDGE, forwarding the user's recorded sessions + baseline from chrome.storage
 * into the page so the website shows real data. No gauge there.
 *
 * On every other page: captures keystroke TIMING (never content), drives the
 * floating gauge, fires nudges, samples a load timeline, and on toggle-off builds
 * a session summary + asks the background worker for an AI debrief.
 */
(function () {
  const { createTracker, ZONES } = window.RedlineFeatures;

  // ----- Dashboard bridge -------------------------------------------------
  const isDashboard = !!document.querySelector('meta[name="redline-app"]');
  if (isDashboard) {
    function sendToPage() {
      chrome.storage.local.get(["sessions", "baseline"], (d) => {
        window.postMessage(
          { __redline: true, type: "sessions", sessions: d.sessions || [], baseline: d.baseline || null },
          "*"
        );
      });
    }
    window.addEventListener("message", (e) => {
      if (e.source !== window) return;
      const d = e.data;
      if (d && d.__redline && d.type === "ready") sendToPage();
    });
    chrome.storage.onChanged.addListener((ch, area) => {
      if (area === "local" && (ch.sessions || ch.baseline)) sendToPage();
    });
    sendToPage();
    setTimeout(sendToPage, 600);
    setTimeout(sendToPage, 1600);
    return; // no monitoring UI on the dashboard
  }

  // ----- Live monitoring --------------------------------------------------
  let enabled = false;
  let gaugeHidden = false;
  let tracker = null;
  let baseline = null;
  let intervalId = null;
  let redlineSince = null;
  let lastNudgeAt = 0;
  let nudgeIdx = 0;
  let series = [];
  let tickCount = 0;
  const SAMPLE_EVERY = 10; // sample the load every ~1.5s for the dashboard replay

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

    tickCount++;
    if (tickCount % SAMPLE_EVERY === 0) {
      series.push(score);
      if (series.length > 200) series.shift();
    }

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
    series = [];
    tickCount = 0;
    window.RedlineWidget.mount();
    window.RedlineWidget.setHidden(gaugeHidden);
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
    summary.series = series.slice();
    tracker = null;

    if (summary.keystrokes < 12) return; // ignore trivial sessions

    chrome.runtime.sendMessage({ type: "saveSession", summary });

    window.RedlineWidget.showDebrief({ title: "Session debrief", summary, loading: true });
    chrome.runtime.sendMessage({ type: "coachDebrief", summary }, (resp) => {
      const text = (resp && resp.text) || localDebrief(summary);
      window.RedlineWidget.updateDebriefBody(text);
    });
  }

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

  function applyState(state) {
    const wasEnabled = enabled;
    enabled = !!state.enabled;
    baseline = state.baseline || null;
    gaugeHidden = !!state.gaugeHidden;
    if (enabled && !wasEnabled) startSession();
    else if (!enabled && wasEnabled) endSession();
    window.RedlineWidget.setHidden(gaugeHidden); // applies live; harmless if unmounted
  }

  chrome.storage.local.get(["enabled", "baseline", "gaugeHidden"], applyState);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    chrome.storage.local.get(["enabled", "baseline", "gaugeHidden"], applyState);
  });

  document.addEventListener("keydown", onKeyDown, true);
})();
