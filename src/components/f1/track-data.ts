import * as THREE from "three";
import type { PitId } from "./f1-context";

/**
 * Track geometry for the F1 mode, digitized from Hari's reference image
 * (slot-car style circuit): long start/finish straight along the bottom,
 * a sweeping ~200° loop filling the right third, a top straight feeding
 * a tight top-left hairpin, a diagonal descent across the interior, a
 * right-hand switchback into the middle chicane, and a final 180° back
 * onto the start/finish straight.
 *
 * Coordinates are world XZ (x east, z south), matching the reference
 * viewed from above. Everything else in this mode derives from this
 * centerline: the ribbon mesh, kerbs, boundaries, pit anchors, minimap.
 */
const CONTROL_POINTS: [number, number][] = [
  // start/finish straight, heading east
  [-88, 46],
  [-60, 47],
  [-24, 47],
  [17, 45],
  // T1 — sweep up into the big loop (left)
  [44, 42],
  [68, 34],
  [87, 17],
  [94.5, -5],
  [88, -29],
  [70, -45],
  // loop top, now heading west onto the top straight
  [46, -49],
  [14, -49.5],
  [-31, -49],
  [-70, -47.5],
  // top-left hairpin (left, 180°)
  [-86, -44],
  [-99, -33],
  [-90, -24],
  // diagonal descent across the interior, heading east-southeast
  [-72, -16],
  [-44, -5],
  [-17, 5],
  [3.5, 14.5],
  // switchback (right, 180°) into the middle section
  [14, 22],
  [15, 29],
  [6, 32],
  // chicane, heading west
  [-13.5, 28],
  [-24.5, 23],
  [-36, 27],
  [-61, 24.5],
  [-81.5, 26.5],
  // final 180° (left) back onto the start/finish straight
  [-95.5, 33],
  [-97, 42.5],
];

export const TRACK_HALF = 4.5; // half-width of the racing surface
export const RUNOFF = 7; // grass beyond this (from track edge) is a hard wall
export const EXTENT_X = 118;
export const EXTENT_Z = 66;

export const trackCurve = new THREE.CatmullRomCurve3(
  CONTROL_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  true,
  "catmullrom",
  0.5
);

export const SAMPLE_COUNT = 768;

export interface TrackSample {
  x: number;
  z: number;
  /** unit tangent (direction of travel) */
  tx: number;
  tz: number;
}

/** Evenly spaced (by arc length) samples around the closed centerline. */
export const samples: TrackSample[] = (() => {
  const out: TrackSample[] = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const u = i / SAMPLE_COUNT;
    const p = trackCurve.getPointAt(u);
    const t = trackCurve.getTangentAt(u);
    out.push({ x: p.x, z: p.z, tx: t.x, tz: t.z });
  }
  return out;
})();

export const TRACK_LENGTH = trackCurve.getLength();

/**
 * Index of the sample nearest to (x, z). With a hint from the previous
 * frame only a small window is scanned — the car moves continuously, so
 * the nearest sample can't jump far between frames.
 */
export function nearestSampleIndex(x: number, z: number, hint = -1): number {
  const scanFrom = hint >= 0 ? hint - 40 : 0;
  const scanTo = hint >= 0 ? hint + 40 : SAMPLE_COUNT - 1;
  let best = 0;
  let bestD = Infinity;
  for (let i = scanFrom; i <= scanTo; i++) {
    const idx = ((i % SAMPLE_COUNT) + SAMPLE_COUNT) % SAMPLE_COUNT;
    const s = samples[idx];
    const dx = x - s.x;
    const dz = z - s.z;
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = idx;
    }
  }
  return best;
}

/* ---------------- pit stops ---------------- */

export interface PitDef {
  id: Exclude<PitId, null>;
  label: string;
  accent: string;
  /** arc-length parameter along the lap where the pit box sits */
  u: number;
  /** +1 = left of the direction of travel, -1 = right */
  side: 1 | -1;
}

export const pits: PitDef[] = [
  { id: "projects", label: "Projects", accent: "#3b82f6", u: 0.09, side: 1 },
  { id: "github", label: "GitHub", accent: "#a78bfa", u: 0.3, side: -1 },
  { id: "about", label: "About", accent: "#10b981", u: 0.5, side: -1 },
  { id: "contact", label: "Contact", accent: "#f59e0b", u: 0.9, side: 1 },
];

export interface PitWorld {
  def: PitDef;
  /** centerline point the pit is attached to */
  x: number;
  z: number;
  /** pit apron (drive-into trigger) center */
  triggerX: number;
  triggerZ: number;
  /** garage building center */
  garageX: number;
  garageZ: number;
  /** garage yaw so its front faces the track */
  yaw: number;
}

export const TRIGGER_RADIUS = 6;

/** Left-hand normal of a tangent (rotate +90° about Y): (x,z) → (z,-x). */
const leftNormal = (tx: number, tz: number): [number, number] => [tz, -tx];

export const pitWorlds: PitWorld[] = pits.map((def) => {
  const p = trackCurve.getPointAt(def.u);
  const t = trackCurve.getTangentAt(def.u);
  const [nx, nz] = leftNormal(t.x, t.z);
  const sx = nx * def.side;
  const sz = nz * def.side;
  const triggerX = p.x + sx * (TRACK_HALF + 3);
  const triggerZ = p.z + sz * (TRACK_HALF + 3);
  const garageX = p.x + sx * (TRACK_HALF + 9.5);
  const garageZ = p.z + sz * (TRACK_HALF + 9.5);
  // garage front looks back toward the track
  const yaw = Math.atan2(-sx, -sz);
  return { def, x: p.x, z: p.z, triggerX, triggerZ, garageX, garageZ, yaw };
});

/* ---------------- spawn / start line ---------------- */

export const START_U = 0.02;

export const spawn = (() => {
  const p = trackCurve.getPointAt(START_U);
  const t = trackCurve.getTangentAt(START_U);
  return { x: p.x, z: p.z, heading: Math.atan2(t.x, t.z) };
})();
