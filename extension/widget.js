/*
 * widget.js — the on-page floating Redline overlay.
 * Rendered inside a Shadow DOM so the host page's CSS can never interfere.
 * Exposes window.RedlineWidget = { mount, unmount, update, showNudge, showDebrief, setActive }.
 */
(function () {
  let host = null;
  let shadow = null;
  let gauge = null;
  let nudgeEl = null;
  let debriefEl = null;
  let nudgeTimer = null;

  const STYLE = `
    :host { all: initial; }
    .wrap {
      position: fixed; right: 20px; bottom: 20px; z-index: 2147483647;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      width: 220px; user-select: none;
    }
    .card {
      background: linear-gradient(160deg, #11151d 0%, #0a0d13 100%);
      border: 1px solid #1f2733; border-radius: 18px;
      box-shadow: 0 12px 40px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04);
      padding: 12px 12px 10px; backdrop-filter: blur(8px);
    }
    .top {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 4px 4px; cursor: grab;
    }
    .brand { display:flex; align-items:center; gap:6px; font-size: 11px; font-weight: 700;
      letter-spacing: 1px; color: #e5e7eb; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e;
      box-shadow: 0 0 8px #22c55e; }
    .dot.off { background:#475569; box-shadow:none; }
    .status { font-size: 9px; color:#64748b; letter-spacing: .5px; }
    .gauge { display:flex; justify-content:center; }
    .nudge {
      margin-top: 8px; font-size: 11.5px; line-height: 1.35; color: #fde68a;
      background: rgba(245,158,11,.10); border: 1px solid rgba(245,158,11,.25);
      border-radius: 10px; padding: 8px 10px; opacity: 0; transform: translateY(6px);
      transition: opacity .25s, transform .25s;
    }
    .nudge.show { opacity: 1; transform: none; }
    .debrief {
      position: fixed; right: 20px; bottom: 20px; width: 300px; z-index: 2147483647;
      background: linear-gradient(160deg, #11151d, #0a0d13);
      border: 1px solid #233044; border-radius: 18px; color: #e5e7eb;
      box-shadow: 0 18px 60px rgba(0,0,0,.6); padding: 16px 16px 14px;
      opacity: 0; transform: translateY(10px); transition: opacity .3s, transform .3s;
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
    .debrief.show { opacity: 1; transform: none; }
    .debrief h3 { margin: 0 0 4px; font-size: 13px; letter-spacing: .5px; }
    .debrief .sub { font-size: 10px; color:#64748b; margin-bottom: 10px; }
    .debrief .body { font-size: 12.5px; line-height: 1.5; color:#cbd5e1; white-space: pre-wrap; }
    .debrief .x { position:absolute; top:10px; right:12px; cursor:pointer; color:#64748b;
      font-size: 16px; line-height: 1; }
    .pill { display:inline-block; font-size:10px; padding:2px 8px; border-radius:999px;
      background:#1e293b; color:#94a3b8; margin-right:6px; margin-top:8px; }
    @keyframes rl-blink { 50% { opacity: 0; } }
    .spin { animation: rl-spin 1s linear infinite; }
    @keyframes rl-spin { to { transform: rotate(360deg); } }
  `;

  function mount() {
    if (host) return;
    host = document.createElement("div");
    host.id = "redline-overlay-host";
    shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLE;
    shadow.appendChild(style);

    const wrap = document.createElement("div");
    wrap.className = "wrap";
    wrap.innerHTML = `
      <div class="card">
        <div class="top" id="rl-drag">
          <div class="brand"><span class="dot" id="rl-dot"></span>REDLINE</div>
          <div class="status" id="rl-status">MONITORING</div>
        </div>
        <div class="gauge" id="rl-gauge"></div>
        <div class="nudge" id="rl-nudge"></div>
      </div>`;
    shadow.appendChild(wrap);

    gauge = window.RedlineTach.create({ size: 196 });
    shadow.getElementById("rl-gauge").appendChild(gauge.el);
    nudgeEl = shadow.getElementById("rl-nudge");

    makeDraggable(wrap, shadow.getElementById("rl-drag"));
    document.documentElement.appendChild(host);
  }

  function makeDraggable(wrap, handle) {
    let sx, sy, ox, oy, dragging = false;
    handle.addEventListener("mousedown", (e) => {
      dragging = true;
      const rect = wrap.getBoundingClientRect();
      ox = rect.left; oy = rect.top; sx = e.clientX; sy = e.clientY;
      wrap.style.right = "auto"; wrap.style.bottom = "auto";
      wrap.style.left = ox + "px"; wrap.style.top = oy + "px";
      handle.style.cursor = "grabbing";
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      wrap.style.left = ox + (e.clientX - sx) + "px";
      wrap.style.top = oy + (e.clientY - sy) + "px";
    });
    window.addEventListener("mouseup", () => { dragging = false; handle.style.cursor = "grab"; });
  }

  function update(score) {
    if (gauge) gauge.setScore(score);
  }

  function setActive(on) {
    if (!shadow) return;
    const dot = shadow.getElementById("rl-dot");
    const status = shadow.getElementById("rl-status");
    if (dot) dot.className = on ? "dot" : "dot off";
    if (status) status.textContent = on ? "MONITORING" : "PAUSED";
  }

  function showNudge(text) {
    if (!nudgeEl) return;
    nudgeEl.textContent = text;
    nudgeEl.classList.add("show");
    clearTimeout(nudgeTimer);
    nudgeTimer = setTimeout(() => nudgeEl.classList.remove("show"), 9000);
  }

  function hideNudge() {
    if (nudgeEl) nudgeEl.classList.remove("show");
  }

  // Show the end-of-session debrief card (feedback + day tips from the coach).
  function showDebrief({ title, body, summary, loading }) {
    if (!shadow) mount();
    if (debriefEl) debriefEl.remove();
    debriefEl = document.createElement("div");
    debriefEl.className = "debrief";
    const peak = summary ? summary.peakLoad : 0;
    const mins = summary ? Math.round(summary.durationSec / 60) : 0;
    debriefEl.innerHTML = `
      <span class="x" id="rl-x">&times;</span>
      <h3>${title || "Session debrief"}</h3>
      <div class="sub">${mins} min session · peak load ${peak}${
        summary && summary.redlineSeconds ? ` · ${summary.redlineSeconds}s in redline` : ""
      }</div>
      <div class="body" id="rl-debrief-body">${
        loading ? '<span class="spin" style="display:inline-block">◠</span> thinking through your session…' : body || ""
      }</div>`;
    shadow.appendChild(debriefEl);
    shadow.getElementById("rl-x").addEventListener("click", () => debriefEl.remove());
    requestAnimationFrame(() => debriefEl.classList.add("show"));
  }

  function updateDebriefBody(text) {
    if (!shadow) return;
    const body = shadow.getElementById("rl-debrief-body");
    if (body) body.textContent = text;
  }

  function unmount() {
    if (host) host.remove();
    host = shadow = gauge = nudgeEl = debriefEl = null;
  }

  window.RedlineWidget = {
    mount, unmount, update, setActive,
    showNudge, hideNudge, showDebrief, updateDebriefBody,
  };
})();
