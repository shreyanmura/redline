/* calibrate.js — collect a calm typing sample and store a personal baseline. */
(function () {
  const TARGET = 60;
  const ta = document.getElementById("ta");
  const fill = document.getElementById("fill");
  const status = document.getElementById("status");
  const events = [];
  let done = false;

  ta.addEventListener("keydown", (e) => {
    const k = e.key;
    let count = false, bs = false;
    if (k === "Backspace" || k === "Delete") { count = true; bs = true; }
    else if (k === "Enter" || k === " " || (k.length === 1 && !e.ctrlKey && !e.metaKey)) count = true;
    if (!count) return;

    events.push({ t: performance.now(), bs });
    const n = Math.min(events.length, TARGET);
    fill.style.width = (n / TARGET) * 100 + "%";
    status.textContent = `${n} / ${TARGET} keystrokes`;

    if (events.length >= TARGET && !done) finish();
  });

  function finish() {
    done = true;
    const baseline = window.RedlineFeatures.baselineFromEvents(events);
    chrome.storage.local.set({ baseline }, () => {
      status.innerHTML = '<span class="done">&#10003; Baseline saved — Redline is now tuned to you.</span> You can close this tab.';
      fill.style.width = "100%";
    });
  }
})();
