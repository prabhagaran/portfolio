"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useCity } from "./city-context";
import { EXTENT, STREET_HALF } from "./layout-data";

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

interface VehicleDef {
  lane: Lane;
  t: number; // 0..1 starting position along the lane
  speed: number; // units/sec
  type: VehicleType;
  color: string;
}

const LANE_LENGTH = EXTENT * 2;
const LANE_OFFSET = STREET_HALF * 0.5; // keeps each lane clear of the opposing one

const CAR_COLORS = ["#c0392b", "#e67e22", "#f1c40f", "#8e44ad", "#16a085", "#334155", "#e2e8f0"];
const BUS_COLORS = ["#2563eb", "#059669", "#f59e0b"];
const VEHICLE_COUNT = 10;

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

function generateVehicles(count: number): VehicleDef[] {
  const rand = mulberry32(0x7a11c);
  const vehicles: VehicleDef[] = [];
  for (let i = 0; i < count; i++) {
    const lane = Math.floor(rand() * 4) as Lane;
    const isBus = rand() < 0.25;
    const speed = isBus ? 4.5 + rand() * 1.5 : 7 + rand() * 3.5;
    const color = isBus
      ? BUS_COLORS[Math.floor(rand() * BUS_COLORS.length)]
      : CAR_COLORS[Math.floor(rand() * CAR_COLORS.length)];
    vehicles.push({ lane, t: rand(), speed, type: isBus ? "bus" : "car", color });
  }
  return vehicles;
}

function Vehicle({ def }: { def: VehicleDef }) {
  const { nightT } = useCity();
  const group = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group>(null);
  const lightsMat = useRef<THREE.MeshStandardMaterial>(null);
  const t = useRef(def.t);

  const isBus = def.type === "bus";
  const WHEEL_R = isBus ? 0.26 : 0.22;
  const width = isBus ? 1.05 : 0.85;
  const height = isBus ? 1.15 : 0.5;
  const length = isBus ? 2.8 : 1.5;
  const bodyY = WHEEL_R + height / 2;

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    t.current += (def.speed / LANE_LENGTH) * delta;
    if (t.current > 1) t.current -= 1;
    const { x, z, heading } = laneToWorld(def.lane, t.current);
    if (group.current) {
      group.current.position.set(x, 0, z);
      group.current.rotation.y = heading;
    }
    if (wheels.current) {
      wheels.current.children.forEach((w) => {
        w.rotation.x += delta * def.speed * 2.2;
      });
    }
    if (lightsMat.current) {
      lightsMat.current.emissiveIntensity = 0.5 + nightT.current * 2.2;
    }
  });

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
      <mesh position={[width * 0.3, bodyY, length / 2 - 0.03]}>
        <boxGeometry args={[0.16, 0.1, 0.04]} />
        <meshStandardMaterial
          ref={lightsMat}
          color="#fff3d0"
          emissive="#ffdd8a"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[-width * 0.3, bodyY, length / 2 - 0.03]}>
        <boxGeometry args={[0.16, 0.1, 0.04]} />
        <meshStandardMaterial color="#fff3d0" emissive="#ffdd8a" emissiveIntensity={0.5} />
      </mesh>
      {/* taillights */}
      <mesh position={[width * 0.3, bodyY, -length / 2 + 0.03]}>
        <boxGeometry args={[0.16, 0.1, 0.04]} />
        <meshStandardMaterial color="#5c1414" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-width * 0.3, bodyY, -length / 2 + 0.03]}>
        <boxGeometry args={[0.16, 0.1, 0.04]} />
        <meshStandardMaterial color="#5c1414" emissive="#ef4444" emissiveIntensity={0.5} />
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

/** Ambient traffic: cars and buses looping the street network, no collision logic — purely atmospheric. */
export function Traffic() {
  const vehicles = useMemo(() => generateVehicles(VEHICLE_COUNT), []);
  return (
    <group>
      {vehicles.map((v, i) => (
        <Vehicle key={i} def={v} />
      ))}
    </group>
  );
}
