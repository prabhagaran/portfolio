"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { STREET_HALF } from "./layout-data";
import { getSignalState } from "./traffic-signal";

const OFF = STREET_HALF + 1.1;
const POLE_HEIGHT = 3.2;

interface PoleDef {
  position: [number, number];
  group: "main" | "cross";
}

// Diagonal pairs of corner poles, alternating which street they
// govern — always shows both a red and a green somewhere at the
// intersection, like a real signalized crossing.
const POLES: PoleDef[] = [
  { position: [OFF, -OFF], group: "main" },
  { position: [-OFF, OFF], group: "main" },
  { position: [OFF, OFF], group: "cross" },
  { position: [-OFF, -OFF], group: "cross" },
];

function SignalPole({ def }: { def: PoleDef }) {
  const redRef = useRef<THREE.MeshStandardMaterial>(null);
  const yellowRef = useRef<THREE.MeshStandardMaterial>(null);
  const greenRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const signal = getSignalState(clock.elapsedTime);
    const phase = def.group === "main" ? signal.main : signal.cross;
    if (redRef.current) redRef.current.emissiveIntensity = phase === "red" ? 2.6 : 0.08;
    if (yellowRef.current) yellowRef.current.emissiveIntensity = phase === "yellow" ? 2.8 : 0.08;
    if (greenRef.current) greenRef.current.emissiveIntensity = phase === "green" ? 2.6 : 0.08;
  });

  return (
    <group position={[def.position[0], 0, def.position[1]]}>
      {/* pole */}
      <mesh position={[0, POLE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, POLE_HEIGHT, 8]} />
        <meshStandardMaterial color="#1c2431" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* signal head housing */}
      <mesh position={[0, POLE_HEIGHT + 0.02, 0]}>
        <boxGeometry args={[0.34, 0.86, 0.28]} />
        <meshStandardMaterial color="#11161f" roughness={0.5} />
      </mesh>
      {/* lamps — double-sided so the phase reads from any approach angle */}
      <mesh position={[0, POLE_HEIGHT + 0.3, 0.15]}>
        <circleGeometry args={[0.09, 16]} />
        <meshStandardMaterial
          ref={redRef}
          color="#7f1d1d"
          emissive="#ff3b3b"
          emissiveIntensity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, POLE_HEIGHT + 0.02, 0.15]}>
        <circleGeometry args={[0.09, 16]} />
        <meshStandardMaterial
          ref={yellowRef}
          color="#78350f"
          emissive="#facc15"
          emissiveIntensity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, POLE_HEIGHT - 0.26, 0.15]}>
        <circleGeometry args={[0.09, 16]} />
        <meshStandardMaterial
          ref={greenRef}
          color="#14532d"
          emissive="#22c55e"
          emissiveIntensity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* base shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.5, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

/** Signal poles at the four corners of the main intersection. */
export function TrafficLights() {
  return (
    <group>
      {POLES.map((p, i) => (
        <SignalPole key={i} def={p} />
      ))}
    </group>
  );
}
