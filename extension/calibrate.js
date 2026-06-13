/*
 * calibrate.js — 3-round calm-typing calibration.
 *
 * Each round needs TARGET character keystrokes. When a round completes we LOCK
 * input (transitioning) so stray keystrokes during the hand-off can't skip rounds
 * or corrupt timing. After 3 rounds we compute the personal baseline and the
 * average calm WPM and save it.
 *
 * WPM is gross WPM = (characters / 5) / minutes, measured from the first to the
 * last character keystroke of the round — so slow typing yields a low WPM.
 */
(function () {
  const TARGET = 55; // character keystrokes per round
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
  let finished = false;
  let transitioning = false;

  let charTimes = []; // timestamps of char keystrokes in the CURRENT round
  let lastT = null; // previous keystroke time in current round (for intervals)
  const intervals = []; // intra-round inter-key intervals (no cross-round gaps)
  let totalChars = 0;
  let totalBs = 0;
  const roundWpms = [];

  const median = (a) => {
    if (!a.length) return 0;
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const std = (a, m) => (a.length ? Math.sqrt(mean(a.map((x) => (x - m) * (x - m)))) : 0);

  function loadRound() {
    sampleEl.textContent = PASSAGES[round];
    stepEl.textContent = `TEST ${round + 1} / 3`;
    for (let i = 0; i < 3; i++) {
      const d = document.getElementById("d" + i);
      d.className = "dot" + (i < round ? " done" : i === round ? " active" : "");
    }
    ta.value = "";
    charTimes = [];
    lastT = null;
    fill.style.width = "0%";
    status.textContent = `0 / ${TARGET} keystrokes`;
    transitioning = false;
    ta.focus();
  }

  ta.addEventListener("keydown", (e) => {
    if (finished || transitioning) return; // hard lock during hand-off
    const k = e.key;
    let count = false, bs = false;
    if (k === "Backspace" || k === "Delete") { count = true; bs = true; }
    else if (k === "Enter" || k === " " || (k.length === 1 && !e.ctrlKey && !e.metaKey)) count = true;
    if (!count) return;

    const t = performance.now();
    if (lastT !== null) intervals.push(t - lastT); // only within a round
    lastT = t;

    if (bs) { totalBs++; }
    else { charTimes.push(t); totalChars++; }

    const n = Math.min(charTimes.length, TARGET);
    fill.style.width = (n / TARGET) * 100 + "%";
    status.textContent = `${n} / ${TARGET} keystrokes`;

    if (charTimes.length >= TARGET) finishRound();
  });

  function finishRound() {
    transitioning = true; // lock immediately — no more keystrokes counted

    // Exact gross WPM for this round: TARGET chars from first to last char time.
    const first = charTimes[0];
    const last = charTimes[TARGET - 1];
    const minutes = (last - first) / 60000;
    const wpm = minutes > 0 ? TARGET / 5 / minutes : 0;
    roundWpms.push(wpm);

    round++;
    if (round < PASSAGES.length) {
      status.textContent = `Round done — get ready for ${round + 1} / 3…`;
      ta.value = "";
      setTimeout(loadRound, 800);
    } else {
      finish();
    }
  }

  function finish() {
    finished = true;
    const med = median(intervals);
    const kpm = med > 0 ? 60000 / med : 0; // keystrokes/min, same metric the gauge uses
    const m = mean(intervals);
    const cv = m > 0 ? std(intervals, m) / m : 0.5;
    const totalKeys = totalChars + totalBs;
    const bsRate = totalKeys > 0 ? totalBs / totalKeys : 0;
    const avgWpm = Math.round(roundWpms.reduce((s, w) => s + w, 0) / roundWpms.length);

    const baseline = { kpm, cv, bsRate, wpm: avgWpm };
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
