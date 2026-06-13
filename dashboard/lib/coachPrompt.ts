import { SessionSummary, ZONES } from "./types";

const PERSONA = `You are "Redline Coach", a warm, grounded companion that helps students notice and ease burnout.
You are NOT a clinician and you NEVER diagnose, label, or use medical terms. You speak in plain, caring, second-person language like a thoughtful friend.
Keep replies to 90-140 words, in two short paragraphs, no markdown, no bullet lists, no headers.`;

// Builds the end-of-session debrief prompt from the keystroke summary.
export function buildDebriefPrompt(s: SessionSummary): string {
  const mins = Math.round((s.durationSec || 0) / 60);
  const hot = s.peakLoad >= ZONES.REDLINE;
  const escalation = hot
    ? `Because the load got high and stayed there, gently and briefly note that if stretches like this keep happening it's worth talking to someone they trust, and that NAMI is there (nami.org, or text "NAMI" to 741741). Mention this once, softly — do not lecture.`
    : `The load stayed manageable, so keep it light and affirming.`;

  return `${PERSONA}

Here is the data from the writing session that just ended (derived only from typing TIMING — never the words themselves):
- Duration: ${mins} minutes
- Peak engine load: ${s.peakLoad}/100 (redline starts at ${ZONES.REDLINE})
- Time spent in the redline: ${s.redlineSeconds} seconds
- Dominant stress signal: ${s.dominantSignal}
- Personalized to their calm baseline: ${s.hadBaseline ? "yes" : "no"}

Write a debrief now. Paragraph 1: reflect warmly on how the session went, referencing the specific data above in human terms. Paragraph 2: give 3-4 concrete, low-effort "go about the rest of your day" suggestions — e.g. step away from the screen, take a short walk, see family or friends, go easy on social media tonight, drink water, get to bed a bit earlier. ${escalation}`;
}

// Offline fallback debrief (used if the Backboard key/SDK is unavailable) so the
// product never shows an error.
export function localDebrief(s: SessionSummary): string {
  const hot = s.peakLoad >= ZONES.REDLINE;
  const lead = hot
    ? `That was a heavy stretch. You peaked at ${s.peakLoad} and spent about ${s.redlineSeconds}s in the redline, driven mostly by ${s.dominantSignal}. Your system was clearly running hot — that's worth listening to, not pushing through.`
    : `Nice work — you mostly stayed in the green tonight (peak ${s.peakLoad}). Your rhythm held together well.`;
  const tips = hot
    ? `Now give the engine a real cool-down: step away from the screen for a bit, take a short walk to reset your body, and go easy on social media tonight. Spend a little time with family or friends, drink some water, and try for an earlier night. And if stretches like this keep stacking up, it's okay to talk to someone you trust — NAMI is there too (nami.org, or text "NAMI" to 741741).`
    : `To keep it that way, take a proper break before the next thing: stretch, get some water, step outside for a few minutes, and spend a little time off your phone with people you like. You don't have to run at 100% to be enough.`;
  return `${lead}\n\n${tips}`;
}
