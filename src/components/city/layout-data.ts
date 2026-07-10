import { projects, type Project } from "@/data/projects";

/**
 * World layout for Electronic City.
 * Ground plane is XZ, y-up. Two streets cross at the origin plaza.
 */

export const STREET_HALF = 4.5; // half-width of a street corridor
export const EXTENT = 42; // streets run from -EXTENT to +EXTENT
export const PLAZA_HALF = 11; // central plaza half-size
export const SIDEWALK_WIDTH = 2.4; // grey strip flanking each street

export const SPAWN: [number, number] = [0, 18];

export interface BuildingDef {
  project: Project;
  /** Building center on the ground plane */
  position: [number, number];
  /** Width, height, depth */
  size: [number, number, number];
  /** Facade tint */
  color: string;
  /** Neon accent for sign + trim */
  accent: string;
  /** Point on the street in front of the entrance */
  doorstep: [number, number];
  /** Rotation around Y so the entrance faces its street */
  rotationY: number;
}

const north = (x: number): Pick<BuildingDef, "position" | "doorstep" | "rotationY"> => ({
  position: [x, -11],
  doorstep: [x, -3.5],
  rotationY: 0,
});
const south = (x: number): Pick<BuildingDef, "position" | "doorstep" | "rotationY"> => ({
  position: [x, 11],
  doorstep: [x, 3.5],
  rotationY: Math.PI,
});

const placements = [
  { ...north(-30), size: [10, 13, 9] as [number, number, number], color: "#1c2a3f", accent: "#3b82f6" },
  { ...north(-15), size: [9, 16, 9] as [number, number, number], color: "#22304a", accent: "#10b981" },
  { ...north(15), size: [9, 10, 8] as [number, number, number], color: "#1c2a3f", accent: "#38bdf8" },
  { ...north(30), size: [8, 8, 8] as [number, number, number], color: "#243046", accent: "#f59e0b" },
  { ...south(-30), size: [10, 9, 9] as [number, number, number], color: "#22304a", accent: "#a78bfa" },
  { ...south(-15), size: [9, 12, 8] as [number, number, number], color: "#1c2a3f", accent: "#34d399" },
  { ...south(15), size: [10, 14, 9] as [number, number, number], color: "#243046", accent: "#60a5fa" },
];

export const buildings: BuildingDef[] = projects.map((project, i) => ({
  project,
  ...placements[i % placements.length],
}));

export interface KioskDef {
  id: "about" | "contact" | "resume" | "skills";
  label: string;
  position: [number, number];
  accent: string;
}

export const kiosks: KioskDef[] = [
  { id: "about", label: "About", position: [8, -8], accent: "#3b82f6" },
  { id: "contact", label: "Communication Hub", position: [-8, 8], accent: "#10b981" },
  { id: "resume", label: "Documentation Center", position: [8, 8], accent: "#f59e0b" },
  { id: "skills", label: "Tech District", position: [-8, -8], accent: "#a78bfa" },
];

/** Display name for the project-buildings cluster, used in the Directory. */
export const INNOVATION_DISTRICT_LABEL = "Innovation District";

export const NILA_POS: [number, number] = [4, 15];

/** Small park in the otherwise-unused southwest quadrant (easter egg). */
export const PARK_POS: [number, number] = [-22, 22];

/**
 * GitHub data tower — a landmark building whose facade renders the real
 * contribution graph. Sits on the `south(30)` slot, the one grid position
 * the 7-project/7-placement cycle above never assigns to a project.
 */
export const GITHUB_BUILDING = {
  position: [30, 11] as [number, number],
  doorstep: [30, 3.5] as [number, number],
  rotationY: Math.PI,
  size: [11, 21, 9] as [number, number, number],
};

/* ---------- walkable-area math (streets + plaza) ---------- */

interface Rect {
  x: [number, number];
  z: [number, number];
}

const RECTS: Rect[] = [
  { x: [-EXTENT, EXTENT], z: [-STREET_HALF, STREET_HALF] }, // main street (E-W)
  { x: [-STREET_HALF, STREET_HALF], z: [-EXTENT, EXTENT] }, // cross street (N-S)
  { x: [-PLAZA_HALF, PLAZA_HALF], z: [-PLAZA_HALF, PLAZA_HALF] }, // plaza
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function inRect(p: [number, number], r: Rect) {
  return p[0] >= r.x[0] && p[0] <= r.x[1] && p[1] >= r.z[0] && p[1] <= r.z[1];
}

function nearestInRect(p: [number, number], r: Rect): [number, number] {
  return [clamp(p[0], r.x[0], r.x[1]), clamp(p[1], r.z[0], r.z[1])];
}

export function isWalkable(p: [number, number]) {
  return RECTS.some((r) => inRect(p, r));
}

/** Clicks off-path snap to the nearest walkable point instead of failing. */
export function clampToWalkable(p: [number, number]): [number, number] {
  if (isWalkable(p)) return p;
  let best: [number, number] = nearestInRect(p, RECTS[0]);
  let bestD = Infinity;
  for (const r of RECTS) {
    const q = nearestInRect(p, r);
    const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = q;
    }
  }
  return best;
}

/**
 * Waypoint path that stays on the street network. Points in the same
 * corridor connect directly; otherwise route through the junction with
 * one L-shaped turn.
 */
export function buildPath(
  from: [number, number],
  to: [number, number]
): [number, number][] {
  const target = clampToWalkable(to);
  const inMain = (p: [number, number]) => inRect(p, RECTS[0]) || inRect(p, RECTS[2]);
  const inCross = (p: [number, number]) => inRect(p, RECTS[1]) || inRect(p, RECTS[2]);

  if ((inMain(from) && inMain(target)) || (inCross(from) && inCross(target))) {
    return [target];
  }
  if (inMain(from) && inCross(target)) {
    const turn: [number, number] = [
      clamp(target[0], -STREET_HALF, STREET_HALF),
      clamp(from[1], -STREET_HALF, STREET_HALF),
    ];
    return [turn, target];
  }
  if (inCross(from) && inMain(target)) {
    const turn: [number, number] = [
      clamp(from[0], -STREET_HALF, STREET_HALF),
      clamp(target[1], -STREET_HALF, STREET_HALF),
    ];
    return [turn, target];
  }
  return [target];
}
