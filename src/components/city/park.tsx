"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useCity } from "./city-context";
import { clampToWalkable, PARK_POS } from "./layout-data";

/**
 * Easter egg: a tiny park in the unused southwest quadrant. The trees
 * are electrolytic capacitors (it IS Electronic City), and the bench
 * opens an off-the-clock "about me" note.
 */
function CapacitorTree({
  position,
  height,
  color,
}: {
  position: [number, number, number];
  height: number;
  color: string;
}) {
  return (
    <group position={position}>
      {/* leads */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* can body */}
      <mesh position={[0, 0.7 + height / 2, 0]}>
        <cylinderGeometry args={[0.55, 0.55, height, 14]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* sleeve stripe (polarity marking) */}
      <mesh position={[0.0, 0.7 + height / 2, 0]}>
        <cylinderGeometry args={[0.56, 0.56, height * 0.85, 14, 1, true, -0.35, 0.7]} />
        <meshStandardMaterial color="#e2e8f0" side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      {/* vented top */}
      <mesh position={[0, 0.72 + height, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.08, 14]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.9, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

export function Park() {
  const { setPanel, moveCommand, nightT } = useCity();
  const [hover, setHover] = useState(false);
  const lampMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (lampMat.current) {
      lampMat.current.emissiveIntensity = 0.15 + nightT.current * 2.6;
    }
  });

  function onBenchClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    moveCommand.current = clampToWalkable(PARK_POS);
    setPanel("park");
  }

  return (
    <group position={[PARK_POS[0], 0, PARK_POS[1]]}>
      {/* grass patch — solder-mask green, naturally */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[7, 24]} />
        <meshStandardMaterial color="#12271e" roughness={1} />
      </mesh>

      {/* the bench (interactive) */}
      <group
        rotation={[0, Math.PI / 4, 0]}
        onClick={onBenchClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "auto";
        }}
      >
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[2.4, 0.12, 0.75]} />
          <meshStandardMaterial color={hover ? "#3f5677" : "#31435f"} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.05, -0.34]} rotation={[-0.22, 0, 0]}>
          <boxGeometry args={[2.4, 0.75, 0.1]} />
          <meshStandardMaterial color={hover ? "#3f5677" : "#31435f"} roughness={0.7} />
        </mesh>
        {(
          [
            [-1, 0.26, 0],
            [1, 0.26, 0],
          ] as const
        ).map((p, i) => (
          <mesh key={i} position={p}>
            <boxGeometry args={[0.14, 0.52, 0.7]} />
            <meshStandardMaterial color="#1b2536" roughness={0.8} />
          </mesh>
        ))}
        {hover && (
          <Html position={[0, 2, 0]} center zIndexRange={[10, 0]}>
            <div className="pointer-events-none whitespace-nowrap rounded-full border border-emerald/40 bg-surface/95 px-3 py-1 font-mono text-xs text-emerald-300 shadow-card">
              Take a seat?
            </div>
          </Html>
        )}
      </group>

      {/* capacitor grove */}
      <CapacitorTree position={[-3.2, 0, -1.6]} height={2.6} color="#1e3a5f" />
      <CapacitorTree position={[2.8, 0, -2.6]} height={3.4} color="#233a2f" />
      <CapacitorTree position={[3.4, 0, 2.2]} height={2.1} color="#3a2a4d" />

      {/* park lamp */}
      <group position={[-2.6, 0, 2.6]}>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.07, 0.1, 2.8, 6]} />
          <meshStandardMaterial color="#2a3547" roughness={0.7} />
        </mesh>
        <mesh position={[0, 2.9, 0]}>
          <sphereGeometry args={[0.22, 10, 8]} />
          <meshStandardMaterial
            ref={lampMat}
            color="#fde68a"
            emissive="#ffd9a0"
            emissiveIntensity={0.15}
          />
        </mesh>
      </group>
    </group>
  );
}
