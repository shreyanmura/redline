# Redline — a tachometer for your mental load

A **"check engine light" for student burnout.** Redline reads your **typing rhythm**
(timing only — never the words) and shows your mental load as a live tachometer.
Type calmly and the needle idles in the green; when stress shows up in your
keystrokes — erratic rhythm, bursts of backspacing, stop‑start pauses — the needle
climbs into the **redline** and a coach steps in.

Built for **Milpitas Hacks · "The Pressure Valve"** (Invisible Burnout / mental‑health track).

> **Why typing?** Under stress, typing rhythm becomes erratic and corrections spike.
> In research, keyboard/mouse behavior can predict strain *better than heart rate* —
> and it's **passive**, so there's no survey to fill out when you're already spiraling.
> We measure deviation from **your own** calm baseline, not a universal threshold.

---

## What's in here

```
extension/    Chrome extension (MV3) — the toggle + the live floating tachometer
dashboard/    Next.js app — weekly trend, tonight's replay, and the AI coach
```

### The two pieces

1. **Extension** — flip the toggle on before you write (e.g. an email). A floating
   tachometer overlays the page and the needle moves in real time — it tracks your
   *instantaneous* pace (speeding up revs it; slowing down drops it) with corrections,
   erratic rhythm, and brief hesitant pauses pushing you into the redline. A second
   toggle **hides/shows** the on‑page gauge. Sustained redline triggers a gentle nudge.
   Flip monitoring **off** and you get an **end‑of‑session debrief**: how it went +
   low‑effort ways to wind down your day. A 3‑round **calibration** learns your calm
   baseline and reports your calm WPM.
2. **Dashboard** — shows **your real recorded sessions** (bridged live from the
   extension): a 7‑day **predictive‑maintenance** trend, a **replay** of your last
   session's spiral, the signal breakdown, and the **Redline Coach** (powered by
   Backboard, with memory across sessions). With no extension installed it shows sample
   data so the page still demos standalone.

---

## Live deployment

**Dashboard:** https://dashboard-shreyanmura-2156s-projects.vercel.app (Vercel, public).
The extension is **pre‑wired to this URL**, so for the demo you only need to load the
extension — no local server required.

## Run it

### 1. Extension (Chrome) — all you need for the demo

1. Go to `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → select the `extension/` folder.
3. Click the Redline icon → flip **Monitoring** on.
4. (Optional) **Calibrate baseline** — type the calm sample once so scoring is tuned to you.
5. Open **Gmail compose** (or any normal text box) and start typing.

> Note: Google Docs renders to a canvas and doesn't expose keystrokes reliably — demo
> in **Gmail** or a plain text field.

The end‑of‑session debrief is fetched from the live dashboard above. The coach calls
Backboard **server‑side only** (`app/api/coach/route.ts`); the API key never ships to the
browser or the extension. If Backboard is ever unreachable, the coach falls back to a
built‑in debrief so nothing breaks on stage.

### 2. Dashboard locally (optional)

```bash
cd dashboard
npm install
# .env.local already holds BACKBOARD_API_KEY (rotate it after the hackathon)
npm run dev          # http://localhost:3000
```

To point the extension at localhost instead of the live URL, set `dashboardUrl` in the
extension's `chrome.storage.local` (or edit `DEFAULT_DASHBOARD` in `background.js` /
`popup.js`).

### Redeploying the dashboard

```bash
cd dashboard
npx vercel deploy --prod --yes   # BACKBOARD_API_KEY is already set in the Vercel project
```

---

## Demo script (~2 min)

1. Open the popup, flip **Monitoring ON**.
2. Open Gmail compose → the floating tachometer appears, **idle / green**.
3. Type a calm sentence → needle stays green.
4. Type a stressed burst — fast, erratic, lots of backspaces → needle climbs
   **amber → redline**, the check‑engine light blinks, a nudge slides in.
5. Flip the toggle **OFF** → the **debrief** appears: how the session went + day tips
   (step away from screens, take a walk, see friends/family, go easy on socials).
6. Switch to the **dashboard**: weekly trend → hit **Replay tonight's session** to watch
   the spiral, then **Get tonight's debrief** for the coach. Close on:
   *"We don't wait for the machine to break."*

---

## Privacy

Redline records **keystroke timing only** — timestamps and a single "was it a
backspace" flag. It never captures the characters you type. Scoring runs locally in
the extension; only an anonymous session **summary** (peak load, time in redline,
dominant signal) is sent to the coach.
