"use client";

import { createRef, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useCity } from "./city-context";
import { EXTENT, STREET_HALF } from "./layout-data";
import { getSignalState } from "./traffic-signal";
import { createObstacleRegistry } from "./vehicle-registry";

/** Deterministic PRNG (mulberry32) — stable traffic layout across renders. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type VehicleType = "car" | "bus";
/** 0: main st. eastbound, 1: main st. westbound, 2: cross st. southbound, 3: cross st. northbound */
type Lane = 0 | 1 | 2 | 3;
const LANES: Lane[] = [0, 1, 2, 3];

interface VehicleDef {
  lane: Lane;
  t: number; // 0..1 starting position along the lane
  speed: number; // units/sec
  type: VehicleType;
  color: string;
}

const LANE_LENGTH = EXTENT * 2;
const LANE_OFFSET = STREET_HALF * 0.5; // keeps each lane clear of the opposing one

// Every lane crosses the intersection at t=0.5 (world origin). Vehicles
// brake starting APPROACH_ZONE units before the stop line and fully
// halt just short of it while their group's signal isn't green; once
// past the line they're committed and clear the junction at full speed.
const STOP_MARGIN = STREET_HALF + 1.6;
const APPROACH_ZONE = 11;
const STOP_T = 0.5 - STOP_MARGIN / LANE_LENGTH;
const APPROACH_T = APPROACH_ZONE / LANE_LENGTH;
const STOP_EPS_T = 0.5 / LANE_LENGTH;

// Car-following: never let a vehicle close to less than this gap
// behind whichever vehicle is ahead of it in the same lane — this is
// what stops vehicles from overlapping, whether catching up to a
// slower one or queuing at a red light.
const MIN_GAP_WORLD = 3.3;
const MIN_GAP_T = MIN_GAP_WORLD / LANE_LENGTH;
const FOLLOW_EASE_T = MIN_GAP_T * 1.4;

const CAR_COLORS = ["#c0392b", "#e67e22", "#f1c40f", "#8e44ad", "#16a085", "#334155", "#e2e8f0"];
const BUS_COLORS = ["#2563eb", "#059669", "#f59e0b"];
const VEHICLE_COUNT = 10;

/** Read by Pedestrians to yield when a vehicle is about to cross their path. */
export const vehicleObstacles = createObstacleRegistry(VEHICLE_COUNT);

function laneToWorld(lane: Lane, t: number): { x: number; z: number; heading: number } {
  const p = t * LANE_LENGTH - EXTENT; // -EXTENT..EXTENT
  switch (lane) {
    case 0: // main street, +X, lane south of center
      return { x: p, z: LANE_OFFSET, heading: Math.PI / 2 };
    case 1: // main street, -X, lane north of center
      return { x: -p, z: -LANE_OFFSET, heading: -Math.PI / 2 };
    case 2: // cross street, +Z, lane east of center
      return { x: LANE_OFFSET, z: p, heading: 0 };
    default: // cross street, -Z, lane west of center
      return { x: -LANE_OFFSET, z: -p, heading: Math.PI };
  }
}

/** Evenly spaces vehicles within each lane so no two ever start overlapping. */
function generateVehicles(count: number): VehicleDef[] {
  const rand = mulberry32(0x7a11c);
  const perLane: VehicleDef[][] = [[], [], [], []];
  for (let i = 0; i < count; i++) {
    const lane = (i % 4) as Lane;
    const isBus = rand() < 0.25;
    const speed = isBus ? 4.5 + rand() * 1.5 : 7 + rand() * 3.5;
    const color = isBus
      ? BUS_COLORS[Math.floor(rand() * BUS_COLORS.length)]
      : CAR_COLORS[Math.floor(rand() * CAR_COLORS.length)];
    perLane[lane].push({ lane, t: 0, speed, type: isBus ? "bus" : "car", color });
  }
  const vehicles: VehicleDef[] = [];
  for (const laneVehicles of perLane) {
    const n = laneVehicles.length;
    laneVehicles.forEach((v, idx) => {
      const jitter = (rand() - 0.5) * (0.5 / Math.max(n, 1));
      let t = (idx + 0.5) / n + jitter;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      v.t = t;
      vehicles.push(v);
    });
  }
  return vehicles;
}

interface VehicleRuntime {
  def: VehicleDef;
  t: number; // mutated directly each frame — not React state
  obstacleIndex: number; // slot in the shared vehicleObstacles registry
  group: RefObject<THREE.Group | null>;
  wheels: RefObject<THREE.Group | null>;
  headMat: THREE.MeshStandardMaterial;
  tailMat: THREE.MeshStandardMaterial;
}

function buildRuntimes(defs: VehicleDef[]): VehicleRuntime[] {
  return defs.map((def, i) => ({
    def,
    t: def.t,
    obstacleIndex: i,
    group: createRef<THREE.Group>(),
    wheels: createRef<THREE.Group>(),
    headMat: new THREE.MeshStandardMaterial({
      color: "#fff3d0",
      emissive: "#ffdd8a",
      emissiveIntensity: 0.5,
    }),
    tailMat: new THREE.MeshStandardMaterial({
      color: "#5c1414",
      emissive: "#ef4444",
      emissiveIntensity: 0.5,
    }),
  }));
}

function VehicleMesh({ r }: { r: VehicleRuntime }) {
  const { def, group, wheels, headMat, tailMat } = r;
  const isBus = def.type === "bus";
  const WHEEL_R = isBus ? 0.26 : 0.22;
  const width = isBus ? 1.05 : 0.85;
  const height = isBus ? 1.15 : 0.5;
  const length = isBus ? 2.8 : 1.5;
  const bodyY = WHEEL_R + height / 2;

  const wheelPositions: [number, number, number][] = [
    [width / 2 + 0.03, WHEEL_R, length / 2 - length * 0.22],
    [-(width / 2 + 0.03), WHEEL_R, length / 2 - length * 0.22],
    [width / 2 + 0.03, WHEEL_R, -(length / 2 - length * 0.22)],
    [-(width / 2 + 0.03), WHEEL_R, -(length / 2 - length * 0.22)],
  ];

  return (
    <group ref={group}>
      {/* body */}
      <mesh position={[0, bodyY, 0]}>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color={def.color} roughness={0.4} metalness={0.35} />
      </mesh>
      {/* cabin (cars only — buses read as one continuous box with window band) */}
      {!isBus && (
        <mesh position={[0, bodyY + height * 0.62, -length * 0.03]}>
          <boxGeometry args={[width * 0.74, height * 0.7, length * 0.52]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
      )}
      {isBus && (
        <mesh position={[0, bodyY + height * 0.14, 0]}>
          <boxGeometry args={[width + 0.02, height * 0.34, length * 0.86]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
      )}
      {/* headlights */}
      <mesh position={[width * 0.3, bodyY, length / 2 - 0.03]} material={headMat}>
        <boxGeometry args={[0.16, 0.1, 0.04]} />
      </mesh>
      <mesh position={[-width * 0.3, bodyY, length / 2 - 0.03]} material={headMat}>
        <boxGeometry args={[0.16, 0.1, 0.04]} />
      </mesh>
      {/* taillights */}
      <mesh position={[width * 0.3, bodyY, -length / 2 + 0.03]} material={tailMat}>
        <boxGeometry args={[0.16, 0.1, 0.04]} />
      </mesh>
      <mesh position={[-width * 0.3, bodyY, -length / 2 + 0.03]} material={tailMat}>
        <boxGeometry args={[0.16, 0.1, 0.04]} />
      </mesh>
      {/* wheels */}
      <group ref={wheels}>
        {wheelPositions.map((p, i) => (
          <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.16, 10]} />
            <meshStandardMaterial color="#0b0f14" roughness={0.9} />
          </mesh>
        ))}
      </group>
      {/* blob shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[width + 0.3, length + 0.4]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/**
 * Ambient traffic: cars and buses looping the street network. A single
 * parent-level update loop processes each lane front-to-back so every
 * vehicle can see the one ahead of it and keep a minimum following
 * gap — this is what prevents overlap, whether from catching up to a
 * slower vehicle or queuing at a red light. Braking is gated by the
 * same shared signal-phase clock the traffic-light poles use.
 */
export function Traffic() {
  const { nightT } = useCity();
  const runtimes = useMemo(() => buildRuntimes(generateVehicles(VEHICLE_COUNT)), []);
  const byLane = useMemo(() => {
    const map: Record<Lane, VehicleRuntime[]> = { 0: [], 1: [], 2: [], 3: [] };
    for (const r of runtimes) map[r.def.lane].push(r);
    return map;
  }, [runtimes]);

  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const signal = getSignalState(clock.elapsedTime);

    for (const lane of LANES) {
      const laneVehicles = byLane[lane];
      // frontmost (highest t) first, so trailing vehicles see updated positions
      const ordered = [...laneVehicles].sort((a, b) => b.t - a.t);
      const laneGroup = lane === 0 || lane === 1 ? "main" : "cross";
      const phase = laneGroup === "main" ? signal.main : signal.cross;

      let aheadT: number | null = null;
      for (const r of ordered) {
        let speedMul = 1;

        const distToStopT = STOP_T - r.t;
        if (phase !== "green" && distToStopT > 0 && distToStopT < APPROACH_T) {
          speedMul =
            distToStopT < STOP_EPS_T
              ? 0
              : THREE.MathUtils.clamp(distToStopT / APPROACH_T, 0.08, 1);
        }

        if (aheadT !== null) {
          const gap = aheadT - r.t;
          if (gap >= 0 && gap < FOLLOW_EASE_T) {
            const followMul =
              gap < MIN_GAP_T
                ? 0
                : THREE.MathUtils.clamp((gap - MIN_GAP_T) / (FOLLOW_EASE_T - MIN_GAP_T), 0.05, 1);
            speedMul = Math.min(speedMul, followMul);
          }
        }

        r.t += (r.def.speed / LANE_LENGTH) * delta * speedMul;
        if (r.t > 1) r.t -= 1;
        aheadT = r.t;

        const { x, z, heading } = laneToWorld(lane, r.t);
        if (r.group.current) {
          r.group.current.position.set(x, 0, z);
          r.group.current.rotation.y = heading;
        }
        if (r.wheels.current) {
          r.wheels.current.children.forEach((w) => {
            w.rotation.x += delta * r.def.speed * 2.2 * speedMul;
          });
        }
        r.headMat.emissiveIntensity = 0.5 + nightT.current * 2.2;
        // taillights flare up like brake lights while slowing
        r.tailMat.emissiveIntensity = 0.4 + nightT.current * 1.6 + (speedMul < 0.95 ? 1.4 : 0);

        // publish position so pedestrians can yield when crossing this lane
        const obstacle = vehicleObstacles[r.obstacleIndex];
        obstacle.position.set(x, 0, z);
        obstacle.radius = r.def.type === "bus" ? 1.7 : 1.1;
      }
    }
  });

  return (
    <group>
      {runtimes.map((r, i) => (
        <VehicleMesh key={i} r={r} />
      ))}
    </group>
  );
}
