"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Car } from "./car";
import { Grandstand, Ground, Kerbs, PitGarages, StartFinish, TrackRibbon } from "./track";
import { spawn } from "./track-data";

const SKY = new THREE.Color("#8db4dd");
const FOG = new THREE.Color("#8db4dd");

/**
 * Fixed daytime lighting — day/night is deliberately an Electronic City
 * exclusive (spec §3.4), so the track keeps one bright, readable look.
 */
function Environment() {
  const { scene } = useThree();
  if (scene.background !== SKY) {
    scene.background = SKY;
    scene.fog = new THREE.Fog(FOG, 80, 190);
  }
  return (
    <>
      <hemisphereLight args={["#bcd6f5", "#32405a", 0.85]} />
      <directionalLight position={[40, 55, 25]} intensity={2.2} color="#fff4e0" />
      <ambientLight intensity={0.16} color="#334866" />
    </>
  );
}

/**
 * Rolling FPS check (starts after a 4s warm-up). Five consecutive
 * sub-25fps seconds triggers the switch-to-classic prompt once —
 * same thresholds as Electronic City.
 */
function PerfMonitor({ onLowFps }: { onLowFps: () => void }) {
  const s = useRef({ frames: 0, last: 0, lowStreak: 0, fired: false, started: 0 });
  useFrame(() => {
    const now = performance.now();
    const st = s.current;
    if (st.started === 0) {
      st.started = now;
      st.last = now;
      return;
    }
    st.frames++;
    if (now - st.last >= 1000) {
      const fps = (st.frames * 1000) / (now - st.last);
      st.frames = 0;
      st.last = now;
      if (now - st.started < 4000) return; // warm-up
      st.lowStreak = fps < 25 ? st.lowStreak + 1 : 0;
      if (st.lowStreak >= 5 && !st.fired) {
        st.fired = true;
        onLowFps();
      }
    }
  });
  return null;
}

export function F1Scene({ onLowFps }: { onLowFps: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{
        position: [spawn.x - Math.sin(spawn.heading) * 9.5, 4.3, spawn.z - Math.cos(spawn.heading) * 9.5],
        fov: 48,
        near: 0.5,
        far: 260,
      }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows={false}
      aria-label="F1 track 3D scene"
    >
      <Environment />
      <Ground />
      <TrackRibbon />
      <Kerbs />
      <StartFinish />
      <PitGarages />
      <Grandstand />
      <Car />
      <PerfMonitor onLowFps={onLowFps} />
    </Canvas>
  );
}
