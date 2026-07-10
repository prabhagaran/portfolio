"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useCity } from "./city-context";
import { NILA_POS } from "./layout-data";

/**
 * Nila — robot mascot (v1, Option B): idle-animated near the spawn point;
 * clicking her opens the "how to use this place" panel. No pathing AI.
 */
export function Nila() {
  const { setPanel, nightT } = useCity();
  const [hover, setHover] = useState(false);
  const body = useRef<THREE.Group>(null);
  const eye = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (body.current) {
      body.current.position.y = 1.15 + Math.sin(t * 1.6) * 0.12; // hover bob
      body.current.rotation.y = Math.sin(t * 0.4) * 0.35;
    }
    if (eye.current) {
      // slow blink + brighter at night
      const blink = Math.sin(t * 2.2) > -0.95 ? 1 : 0.15;
      eye.current.emissiveIntensity = (1.2 + nightT.current * 1.2) * blink * (hover ? 1.5 : 1);
    }
  });

  function onClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    setPanel("nila");
  }

  return (
    <group position={[NILA_POS[0], 0, NILA_POS[1]]}>
      <group
        ref={body}
        onClick={onClick}
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
        {/* torso */}
        <mesh>
          <capsuleGeometry args={[0.42, 0.5, 6, 14]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.15} />
        </mesh>
        {/* face plate */}
        <mesh position={[0, 0.32, 0.34]}>
          <boxGeometry args={[0.52, 0.3, 0.18]} />
          <meshStandardMaterial color="#0f172a" roughness={0.25} />
        </mesh>
        {/* eyes */}
        <mesh position={[0, 0.32, 0.44]}>
          <boxGeometry args={[0.34, 0.08, 0.02]} />
          <meshStandardMaterial
            ref={eye}
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={1.2}
          />
        </mesh>
        {/* antenna */}
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.35, 5]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, 1.08, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1.6} />
        </mesh>
        {/* arms */}
        <mesh position={[-0.55, 0.05, 0]} rotation={[0, 0, 0.5]}>
          <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>
        <mesh position={[0.55, 0.05, 0]} rotation={[0, 0, -0.5]}>
          <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>
      </group>

      {/* greeting bubble */}
      <Html position={[0, 2.6, 0]} center zIndexRange={[10, 0]}>
        <button
          type="button"
          onClick={() => setPanel("nila")}
          className="whitespace-nowrap rounded-full border border-emerald/40 bg-surface/95 px-3 py-1 font-mono text-[11px] text-emerald-300 shadow-card transition-colors duration-200 hover:border-emerald/70"
        >
          Hi, I&apos;m Nila — need a tour?
        </button>
      </Html>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.7, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
