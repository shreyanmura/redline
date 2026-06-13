/* popup.js — toggle + stats. Writes `enabled` to storage; content scripts react. */
const $ = (id) => document.getElementById(id);
const DEFAULT_DASHBOARD = "https://dashboard-shreyanmura-2156s-projects.vercel.app";

async function render() {
  const { enabled, peakToday = 0, sessions = [], baseline, dashboardUrl } =
    await chrome.storage.local.get(["enabled", "peakToday", "sessions", "baseline", "dashboardUrl"]);
  $("toggle").checked = !!enabled;
  $("state").textContent = enabled ? "On — watching your rhythm" : "Off";
  $("peak").textContent = peakToday || 0;
  $("sessions").textContent = (sessions || []).filter(isToday).length;
  $("cal").textContent = baseline ? "Set" : "—";
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

$("dash").addEventListener("click", (e) => {
  chrome.tabs.create({ url: e.target.dataset.url || DEFAULT_DASHBOARD });
});

$("calibrate").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("calibrate.html") });
});

render();
