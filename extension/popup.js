/* popup.js — toggles + stats. Writes to storage; content scripts react. */
const $ = (id) => document.getElementById(id);
const DEFAULT_DASHBOARD = "https://dashboard-shreyanmura-2156s-projects.vercel.app";

async function render() {
  const { enabled, gaugeHidden, peakToday = 0, sessions = [], baseline, dashboardUrl } =
    await chrome.storage.local.get([
      "enabled", "gaugeHidden", "peakToday", "sessions", "baseline", "dashboardUrl",
    ]);
  $("toggle").checked = !!enabled;
  $("state").textContent = enabled ? "On — watching your rhythm" : "Off";
  $("gaugeToggle").checked = !gaugeHidden;
  $("gaugeState").textContent = gaugeHidden ? "Hidden" : "Visible";
  $("peak").textContent = peakToday || 0;
  $("sessions").textContent = (sessions || []).filter(isToday).length;
  $("cal").textContent = baseline && baseline.wpm ? `${baseline.wpm}` : baseline ? "Set" : "—";
  $("calLbl").textContent = baseline && baseline.wpm ? "CALM WPM" : "BASELINE";
  $("dash").dataset.url = dashboardUrl || DEFAULT_DASHBOARD;
}

function isToday(s) {
  if (!s || !s.endedAt) return false;
  const d = new Date(s.endedAt), n = new Date();
  return d.toDateString() === n.toDateString();
}

$("toggle").addEventListener("change", async (e) => {
  await chrome.storage.local.set({ enabled: e.target.checked });
  render();
});

$("gaugeToggle").addEventListener("change", async (e) => {
  // checked = visible, so gaugeHidden is the inverse
  await chrome.storage.local.set({ gaugeHidden: !e.target.checked });
  render();
});

$("dash").addEventListener("click", (e) => {
  chrome.tabs.create({ url: e.target.dataset.url || DEFAULT_DASHBOARD });
});

$("calibrate").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("calibrate.html") });
});

$("reset").addEventListener("click", async () => {
  const ok = confirm(
    "Reset all recorded activity?\n\nThis clears your session history, stats, and calm-WPM baseline on the extension AND the dashboard. You'll need to recalibrate."
  );
  if (!ok) return;
  // Clearing these makes the bridge push an empty state to the dashboard, so the
  // website reverts to match the extension automatically.
  await chrome.storage.local.remove(["sessions", "peakToday", "coachThreadId", "baseline"]);
  render();
});

render();
