/*
 * background.js — MV3 service worker.
 * - Stores session summaries (for the dashboard + popup stats).
 * - Relays end-of-session debrief requests to the dashboard's /api/coach route,
 *   which talks to Backboard server-side (the API key never lives in the
 *   extension).
 */
const DEFAULT_DASHBOARD = "https://dashboard-shreyanmura-2156s-projects.vercel.app";

async function getDashboardUrl() {
  const { dashboardUrl } = await chrome.storage.local.get("dashboardUrl");
  return dashboardUrl || DEFAULT_DASHBOARD;
}

async function saveSession(summary) {
  const { sessions = [] } = await chrome.storage.local.get("sessions");
  const stamped = { ...summary, endedAt: Date.now() };
  sessions.push(stamped);
  // keep last 50
  const trimmed = sessions.slice(-50);
  const peakToday = trimmed
    .filter((s) => isToday(s.endedAt))
    .reduce((m, s) => Math.max(m, s.peakLoad), 0);
  await chrome.storage.local.set({ sessions: trimmed, peakToday });
}

function isToday(ts) {
  const d = new Date(ts);
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

async function fetchDebrief(summary) {
  try {
    const base = await getDashboardUrl();
    const { coachThreadId } = await chrome.storage.local.get("coachThreadId");
    const res = await fetch(`${base}/api/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "debrief", summary, threadId: coachThreadId }),
    });
    if (!res.ok) return { text: null };
    const data = await res.json();
    // Persist the thread so the coach remembers this user across sessions.
    if (data.threadId) await chrome.storage.local.set({ coachThreadId: data.threadId });
    return { text: data.text || null };
  } catch (e) {
    return { text: null };
  }
}

// Inject Redline into already-open tabs so the gauge works without a manual
// refresh after the extension is (re)loaded. Newly opened tabs get the gauge via
// the manifest content_scripts entry. Restricted pages (chrome://, the Web Store,
// the PDF viewer, etc.) can't be injected — those need a normal page.
function injectOpenTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      const url = tab.url || "";
      if (!/^https?:\/\//.test(url)) continue;
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          files: ["features.js", "tachometer.js", "widget.js", "content.js"],
        })
        .catch(() => {});
    }
  });
}
chrome.runtime.onInstalled.addListener(injectOpenTabs);
chrome.runtime.onStartup.addListener(injectOpenTabs);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "saveSession") {
    saveSession(msg.summary);
    return; // no async response needed
  }
  if (msg.type === "coachDebrief") {
    fetchDebrief(msg.summary).then(sendResponse);
    return true; // keep the message channel open for the async response
  }
});
