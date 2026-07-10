"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useCity } from "./city-context";

const COUNT = 1100;
const AREA = 55; // half-extent around the city center
const TOP = 30;

/** Deterministic PRNG (mulberry32) — stable drop field across renders. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lightweight rain: one Points cloud, opacity driven by rainT. */
export function Rain() {
  const { rainT } = useCity();
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);

  const data = useMemo(() => {
    const rand = mulberry32(0x5eed);
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (rand() * 2 - 1) * AREA;
      positions[i * 3 + 1] = rand() * TOP;
      positions[i * 3 + 2] = (rand() * 2 - 1) * AREA;
      speeds[i] = 20 + rand() * 12;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const t = rainT.current;
    if (mat.current) mat.current.opacity = t * 0.5;
    if (!points.current) return;
    if (t < 0.02) {
      points.current.visible = false;
      return;
    }
    points.current.visible = true;
    const attr = points.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      let y = attr.getY(i) - data.speeds[i] * delta;
      if (y < 0) y = TOP;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points} visible={false} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        color="#9dbde0"
        size={0.09}
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
