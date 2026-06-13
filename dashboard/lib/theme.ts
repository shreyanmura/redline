// Engine-load color + state language for the redesigned UI.
// Red begins at 80, per the instrument-panel spec.

export const ZONE = { GREEN: 45, YELLOW: 65, RED: 80 };

export function loadColor(v: number): string {
  if (v >= ZONE.RED) return "#ff3b30";
  if (v >= ZONE.YELLOW) return "#ff9f0a";
  if (v >= ZONE.GREEN) return "#ffd60a";
  return "#30d158";
}

export function loadState(v: number): { label: string; msg: string } {
  if (v >= ZONE.RED) return { label: "Redline", msg: "Ease off — your engine is past the limit." };
  if (v >= ZONE.YELLOW) return { label: "High load", msg: "Running hot — worth taking a breather soon." };
  if (v >= ZONE.GREEN) return { label: "Revving", msg: "Load is climbing — worth a check-in." };
  return { label: "Idle", msg: "Running cool — nice and steady." };
}

export const EASE = [0.22, 1, 0.36, 1] as const;
