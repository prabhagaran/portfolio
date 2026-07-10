"use client";

import { createRef, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { EXTENT, SIDEWALK_CENTER } from "./layout-data";
import { vehicleObstacles } from "./traffic";

/** Deterministic PRNG (mulberry32) — stable pedestrian layout across renders. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 0: main-south sidewalk +X, 1: main-north sidewalk -X, 2: cross-east sidewalk +Z, 3: cross-west sidewalk -Z */
type Path = 0 | 1 | 2 | 3;
const PATHS: Path[] = [0, 1, 2, 3];

interface PedestrianDef {
  path: Path;
  t: number; // 0..1 starting position along the sidewalk
  speed: number; // units/sec
  shirt: string;
  pants: string;
}

const PATH_LENGTH = EXTENT * 2;

// Same car-following idea as vehicle traffic, scaled down for foot
// traffic — keeps people from ever overlapping on a shared sidewalk.
const MIN_GAP_WORLD = 1.1;
const MIN_GAP_T = MIN_GAP_WORLD / PATH_LENGTH;
const FOLLOW_EASE_T = MIN_GAP_T * 1.8;

// Sidewalks run the full block length, so a walker on the main
// street's sidewalk does cross the cross street's vehicle lane (and
// vice versa) once per lap. Pause rather than clip through — checked
// against the live vehicle registry Traffic publishes each frame.
const PED_RADIUS = 0.3;
const YIELD_BUFFER = 0.9;

const SHIRT_COLORS = ["#dc2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#e2e8f0"];
const PANTS_COLORS = ["#1e293b", "#374151", "#44403c", "#1c2536"];
const PEDESTRIAN_COUNT = 8;

function pathToWorld(path: Path, t: number): { x: number; z: number; heading: number } {
  const p = t * PATH_LENGTH - EXTENT;
  switch (path) {
    case 0: // south sidewalk of the main street, walking +X
      return { x: p, z: SIDEWALK_CENTER, heading: Math.PI / 2 };
    case 1: // north sidewalk of the main street, walking -X
      return { x: -p, z: -SIDEWALK_CENTER, heading: -Math.PI / 2 };
    case 2: // east sidewalk of the cross street, walking +Z
      return { x: SIDEWALK_CENTER, z: p, heading: 0 };
    default: // west sidewalk of the cross street, walking -Z
      return { x: -SIDEWALK_CENTER, z: -p, heading: Math.PI };
  }
}

/** Evenly spaces walkers within each sidewalk path so none start overlapping. */
function generatePedestrians(count: number): PedestrianDef[] {
  const rand = mulberry32(0xbeac0d);
  const perPath: PedestrianDef[][] = [[], [], [], []];
  for (let i = 0; i < count; i++) {
    const path = (i % 4) as Path;
    const speed = 1.1 + rand() * 0.9;
    const shirt = SHIRT_COLORS[Math.floor(rand() * SHIRT_COLORS.length)];
    const pants = PANTS_COLORS[Math.floor(rand() * PANTS_COLORS.length)];
    perPath[path].push({ path, t: 0, speed, shirt, pants });
  }
  const pedestrians: PedestrianDef[] = [];
  for (const pathWalkers of perPath) {
    const n = pathWalkers.length;
    pathWalkers.forEach((p, idx) => {
      const jitter = (rand() - 0.5) * (0.5 / Math.max(n, 1));
      let t = (idx + 0.5) / n + jitter;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      p.t = t;
      pedestrians.push(p);
    });
  }
  return pedestrians;
}

interface PedestrianRuntime {
  def: PedestrianDef;
  t: number; // mutated directly each frame — not React state
  walkPhase: number;
  group: RefObject<THREE.Group | null>;
  legL: RefObject<THREE.Group | null>;
  legR: RefObject<THREE.Group | null>;
  armL: RefObject<THREE.Group | null>;
  armR: RefObject<THREE.Group | null>;
}

function buildRuntimes(defs: PedestrianDef[]): PedestrianRuntime[] {
  return defs.map((def) => ({
    def,
    t: def.t,
    walkPhase: Math.random() * Math.PI * 2,
    group: createRef<THREE.Group>(),
    legL: createRef<THREE.Group>(),
    legR: createRef<THREE.Group>(),
    armL: createRef<THREE.Group>(),
    armR: createRef<THREE.Group>(),
  }));
}

function PedestrianMesh({ r }: { r: PedestrianRuntime }) {
  const { def, group, legL, legR, armL, armR } = r;
  return (
    <group ref={group}>
      {/* legs */}
      <group ref={legL} position={[-0.08, 0.42, 0]}>
        <mesh position={[0, -0.19, 0]}>
          <capsuleGeometry args={[0.065, 0.34, 4, 8]} />
          <meshStandardMaterial color={def.pants} roughness={0.75} />
        </mesh>
      </group>
      <group ref={legR} position={[0.08, 0.42, 0]}>
        <mesh position={[0, -0.19, 0]}>
          <capsuleGeometry args={[0.065, 0.34, 4, 8]} />
          <meshStandardMaterial color={def.pants} roughness={0.75} />
        </mesh>
      </group>
      {/* arms */}
      <group ref={armL} position={[-0.19, 0.92, 0]}>
        <mesh position={[0, -0.16, 0]}>
          <capsuleGeometry args={[0.045, 0.26, 4, 8]} />
          <meshStandardMaterial color={def.shirt} roughness={0.7} />
        </mesh>
      </group>
      <group ref={armR} position={[0.19, 0.92, 0]}>
        <mesh position={[0, -0.16, 0]}>
          <capsuleGeometry args={[0.045, 0.26, 4, 8]} />
          <meshStandardMaterial color={def.shirt} roughness={0.7} />
        </mesh>
      </group>
      {/* torso */}
      <mesh position={[0, 0.78, 0]}>
        <capsuleGeometry args={[0.14, 0.32, 4, 8]} />
        <meshStandardMaterial color={def.shirt} roughness={0.65} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.13, 0]}>
        <sphereGeometry args={[0.115, 10, 10]} />
        <meshStandardMaterial color="#dcaa82" roughness={0.6} />
      </mesh>
      {/* blob shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.28, 10]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

/**
 * Ambient pedestrians walking the sidewalks — same car-following
 * treatment as vehicle traffic (frontmost-first, minimum gap) so
 * people never overlap, just scaled down for foot speed. They stay on
 * the sidewalks rather than crossing the road, so no interaction with
 * the traffic-light signal system is needed.
 */
export function Pedestrians() {
  const runtimes = useMemo(() => buildRuntimes(generatePedestrians(PEDESTRIAN_COUNT)), []);
  const byPath = useMemo(() => {
    const map: Record<Path, PedestrianRuntime[]> = { 0: [], 1: [], 2: [], 3: [] };
    for (const r of runtimes) map[r.def.path].push(r);
    return map;
  }, [runtimes]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);

    for (const path of PATHS) {
      const walkers = byPath[path];
      const ordered = [...walkers].sort((a, b) => b.t - a.t);

      let aheadT: number | null = null;
      for (const r of ordered) {
        let speedMul = 1;
        if (aheadT !== null) {
          const gap = aheadT - r.t;
          if (gap >= 0 && gap < FOLLOW_EASE_T) {
            speedMul =
              gap < MIN_GAP_T
                ? 0
                : THREE.MathUtils.clamp((gap - MIN_GAP_T) / (FOLLOW_EASE_T - MIN_GAP_T), 0.05, 1);
          }
        }

        // yield if a vehicle is currently near this pedestrian's spot on the sidewalk
        const cur = pathToWorld(path, r.t);
        for (const obs of vehicleObstacles) {
          const dx = obs.position.x - cur.x;
          const dz = obs.position.z - cur.z;
          const threshold = obs.radius + PED_RADIUS + YIELD_BUFFER;
          if (dx * dx + dz * dz < threshold * threshold) {
            speedMul = 0;
            break;
          }
        }

        r.t += (r.def.speed / PATH_LENGTH) * delta * speedMul;
        if (r.t > 1) r.t -= 1;
        aheadT = r.t;

        const { x, z, heading } = pathToWorld(path, r.t);
        r.walkPhase += delta * r.def.speed * 5.5 * speedMul;
        const swing = Math.sin(r.walkPhase) * (speedMul > 0.05 ? 0.55 : 0);

        if (r.group.current) {
          r.group.current.position.set(x, Math.abs(Math.sin(r.walkPhase)) * 0.025, z);
          r.group.current.rotation.y = heading;
        }
        if (r.legL.current) r.legL.current.rotation.x = swing;
        if (r.legR.current) r.legR.current.rotation.x = -swing;
        if (r.armL.current) r.armL.current.rotation.x = -swing;
        if (r.armR.current) r.armR.current.rotation.x = swing;
      }
    }
  });

  return (
    <group>
      {runtimes.map((r, i) => (
        <PedestrianMesh key={i} r={r} />
      ))}
    </group>
  );
}
