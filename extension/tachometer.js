/*
 * tachometer.js — a self-contained animated SVG gauge (no framework).
 * Exposes window.RedlineTach.create(opts) -> { el, setScore(score) }.
 *
 * Renders a 270° automotive tachometer: green idle zone -> amber -> redline,
 * a sweeping needle, a digital readout, and a check-engine icon that blinks
 * when the needle crosses into the redline.
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const SWEEP = 270; // total arc degrees
  const A0 = -135; // score 0 angle (measured from 12 o'clock, clockwise)

  const angleFor = (score) => A0 + (Math.max(0, Math.min(100, score)) / 100) * SWEEP;

  function polar(cx, cy, r, angleDeg) {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function arcPath(cx, cy, r, t0, t1) {
    const a0 = angleFor(t0);
    const a1 = angleFor(t1);
    const [x0, y0] = polar(cx, cy, r, a0);
    const [x1, y1] = polar(cx, cy, r, a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }

  function el(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function create(opts) {
    opts = opts || {};
    const size = opts.size || 200;
    const cx = 100;
    const cy = 104;
    const r = 78;

    const svg = el("svg", {
      viewBox: "0 0 200 200",
      width: size,
      height: size,
      style: "display:block;overflow:visible",
    });

    // Glow filter for the active zone / needle.
    const defs = el("defs", {});
    defs.innerHTML = `
      <filter id="rl-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="rl-green" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#16a34a"/><stop offset="1" stop-color="#4ade80"/>
      </linearGradient>
      <linearGradient id="rl-amber" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#d97706"/><stop offset="1" stop-color="#fbbf24"/>
      </linearGradient>
      <linearGradient id="rl-red" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#dc2626"/><stop offset="1" stop-color="#f87171"/>
      </linearGradient>`;
    svg.appendChild(defs);

    // Dark base track.
    svg.appendChild(
      el("path", {
        d: arcPath(cx, cy, r, 0, 100),
        fill: "none",
        stroke: "#1f2530",
        "stroke-width": 14,
        "stroke-linecap": "round",
      })
    );

    // Colored zones (slightly dimmed; the active one brightens via needle glow).
    const zones = [
      { a: 0, b: 45, c: "url(#rl-green)" },
      { a: 45, b: 78, c: "url(#rl-amber)" },
      { a: 78, b: 100, c: "url(#rl-red)" },
    ];
    for (const z of zones) {
      svg.appendChild(
        el("path", {
          d: arcPath(cx, cy, r, z.a, z.b),
          fill: "none",
          stroke: z.c,
          "stroke-width": 14,
          "stroke-linecap": "butt",
          opacity: 0.85,
        })
      );
    }

    // Tick marks every 10.
    for (let s = 0; s <= 100; s += 10) {
      const ang = angleFor(s);
      const [ix, iy] = polar(cx, cy, r - 12, ang);
      const [ox, oy] = polar(cx, cy, r - 4, ang);
      svg.appendChild(
        el("line", {
          x1: ix, y1: iy, x2: ox, y2: oy,
          stroke: "#64748b", "stroke-width": s % 20 === 0 ? 2 : 1,
        })
      );
    }

    // Needle (a thin triangle) + hub.
    const needle = el("polygon", {
      points: "100,104 97,104 100,30 103,104",
      fill: "#e5e7eb",
      filter: "url(#rl-glow)",
      style: "transform-box:view-box;transform-origin:100px 104px;transition:transform 220ms cubic-bezier(.22,1,.36,1)",
    });
    svg.appendChild(needle);
    svg.appendChild(el("circle", { cx, cy, r: 7, fill: "#0b0e14", stroke: "#94a3b8", "stroke-width": 2 }));

    // Digital readout.
    const readout = el("text", {
      x: 100, y: 150, "text-anchor": "middle",
      "font-family": "ui-monospace,Menlo,monospace", "font-size": 30,
      "font-weight": 700, fill: "#e5e7eb",
    });
    readout.textContent = "0";
    svg.appendChild(readout);

    const label = el("text", {
      x: 100, y: 169, "text-anchor": "middle",
      "font-family": "ui-sans-serif,system-ui,sans-serif", "font-size": 12,
      "letter-spacing": 2, fill: "#64748b",
    });
    label.textContent = "ENGINE LOAD";
    svg.appendChild(label);

    const unit = el("text", {
      x: 100, y: 184, "text-anchor": "middle",
      "font-family": "ui-monospace,Menlo,monospace", "font-size": 12,
      "letter-spacing": 1, fill: "#94a3b8",
    });
    unit.textContent = "( 0 – 100 )";
    svg.appendChild(unit);

    // Check-engine warning icon (hidden until redline).
    const warn = el("g", { opacity: 0 });
    warn.innerHTML = `
      <g transform="translate(100,86)">
        <path d="M-10 2 q0 -7 7 -7 l2 0 0 -2 4 0 0 2 3 0 q5 0 5 5 l0 4 2 0 0 4 -2 0 0 1 q0 4 -4 4 l-12 0 q-5 0 -5 -5 z"
              fill="#ef4444"/>
        <rect x="-2" y="-1" width="3" height="6" rx="1" fill="#0b0e14"/>
        <rect x="-2" y="6" width="3" height="2" rx="1" fill="#0b0e14"/>
      </g>`;
    svg.appendChild(warn);

    function colorFor(score) {
      if (score >= 78) return "#f87171";
      if (score >= 45) return "#fbbf24";
      return "#4ade80";
    }

    function setScore(score) {
      const s = Math.max(0, Math.min(100, Math.round(score)));
      const ang = angleFor(s);
      needle.style.transform = `rotate(${ang}deg)`;
      needle.setAttribute("fill", colorFor(s));
      readout.textContent = String(s);
      readout.setAttribute("fill", colorFor(s));
      const redlining = s >= 78;
      warn.setAttribute("opacity", redlining ? 1 : 0);
      warn.style.animation = redlining ? "rl-blink 0.7s steps(1) infinite" : "none";
    }

    setScore(0);
    return { el: svg, setScore };
  }

  window.RedlineTach = { create };
})();
