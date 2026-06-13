/*
 * calibrate.js — 3-round calm-typing calibration.
 * Each round collects ~55 keystrokes, shows progress (Test X / 3), then advances.
 * After round 3 we compute the personal baseline + average calm WPM and save it.
 */
(function () {
  const TARGET = 55; // character-producing keystrokes per round
  const PASSAGES = [
    "The quietest mornings make the clearest afternoons, and there is enough time for the things that matter most.",
    "Slow water still gets there. One steady line at a time, the page fills and the day takes care of itself.",
    "I can do hard things without rushing. A calm mind keeps its own rhythm, unhurried, patient, and sure of the way.",
  ];

  const ta = document.getElementById("ta");
  const fill = document.getElementById("fill");
  const status = document.getElementById("status");
  const sampleEl = document.getElementById("sample");
  const stepEl = document.getElementById("step");

  let round = 0;
  let allEvents = []; // {t, bs} across all rounds (for cv/kpm/bsRate)
  let roundChars = 0;
  let roundStart = null;
  let roundWpms = [];
  let totalKeys = 0;
  let finished = false;

  function loadRound() {
    sampleEl.textContent = PASSAGES[round];
    stepEl.textContent = `TEST ${round + 1} / 3`;
    for (let i = 0; i < 3; i++) {
      const d = document.getElementById("d" + i);
      d.className = "dot" + (i < round ? " done" : i === round ? " active" : "");
    }
    ta.value = "";
    roundChars = 0;
    roundStart = null;
    fill.style.width = "0%";
    status.textContent = `0 / ${TARGET} keystrokes`;
    ta.focus();
  }

  ta.addEventListener("keydown", (e) => {
    if (finished) return;
    const k = e.key;
    let count = false, bs = false;
    if (k === "Backspace" || k === "Delete") { count = true; bs = true; }
    else if (k === "Enter" || k === " " || (k.length === 1 && !e.ctrlKey && !e.metaKey)) count = true;
    if (!count) return;

    const t = performance.now();
    if (roundStart === null) roundStart = t;
    allEvents.push({ t, bs });
    totalKeys++;
    if (!bs) roundChars++;

    const n = Math.min(roundChars, TARGET);
    fill.style.width = (n / TARGET) * 100 + "%";
    status.textContent = `${n} / ${TARGET} keystrokes`;

    if (roundChars >= TARGET) finishRound(t);
  });

  function finishRound(t) {
    const mins = (t - roundStart) / 60000;
    const wpm = mins > 0 ? roundChars / 5 / mins : 0;
    roundWpms.push(wpm);

    round++;
    if (round < PASSAGES.length) {
      status.textContent = "Nice — next round…";
      setTimeout(loadRound, 650);
    } else {
      finish();
    }
  }

  function finish() {
    finished = true;
    const baseline = window.RedlineFeatures.baselineFromEvents(allEvents) || {};
    const avgWpm = Math.round(roundWpms.reduce((s, w) => s + w, 0) / roundWpms.length);
    baseline.wpm = avgWpm; // cleaner per-round average (ignores between-round gaps)

    chrome.storage.local.set({ baseline }, () => {
      document.getElementById("testScreen").style.display = "none";
      document.getElementById("wpm").textContent = avgWpm;
      document.getElementById("mWpm").textContent = avgWpm;
      document.getElementById("mKeys").textContent = totalKeys;
      document.getElementById("result").classList.add("show");
    });
  }

  document.getElementById("closeBtn").addEventListener("click", () => window.close());

  loadRound();
})();
