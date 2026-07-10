"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useCity } from "./city-context";
import { Ground, Buildings, Kiosks, Streetlights } from "./city";
import { Player } from "./player";
import { Nila } from "./nila";
import { Rain } from "./rain";
import { Park } from "./park";
import { StreetSigns } from "./street-signs";
import { GithubBuilding } from "./github-building";

const DAY_SKY = new THREE.Color("#8db4dd");
const NIGHT_SKY = new THREE.Color("#060a12");
const DAY_FOG = new THREE.Color("#8db4dd");
const NIGHT_FOG = new THREE.Color("#080d16");

/** Lerps every global lighting parameter toward day/night each frame. */
function Environment() {
  const { night, nightT, weather, rainT } = useCity();
  const { scene } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const skyColor = useRef(new THREE.Color().copy(DAY_SKY));
  const fogColor = useRef(new THREE.Color().copy(DAY_FOG));

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const target = night ? 1 : 0;
    // animated crossfade, not an instant cut (~1.2s)
    nightT.current += (target - nightT.current) * Math.min(1, delta * 2.5);
    const t = nightT.current;
    // weather fades on the same clock
    const rainTarget = weather === "rain" ? 1 : 0;
    rainT.current += (rainTarget - rainT.current) * Math.min(1, delta * 1.8);
    const r = rainT.current;

    skyColor.current.copy(DAY_SKY).lerp(NIGHT_SKY, t);
    fogColor.current.copy(DAY_FOG).lerp(NIGHT_FOG, t);
    scene.background = skyColor.current;
    if (!scene.fog) scene.fog = new THREE.Fog(fogColor.current, 55, 130);
    const fog = scene.fog as THREE.Fog;
    fog.color = fogColor.current;
    fog.near = 55 - r * 20; // rain closes visibility in a little
    fog.far = 130 - r * 35;

    if (hemi.current) hemi.current.intensity = (0.9 - t * 0.72) * (1 - r * 0.25);
    if (sun.current) {
      sun.current.intensity = (2.4 - t * 2.15) * (1 - r * 0.3);
      sun.current.color.setStyle(t > 0.5 ? "#93b4e8" : "#fff4e0");
    }
  });

  return (
    <>
      <hemisphereLight
        ref={hemi}
        args={["#bcd6f5", "#32405a", 0.9]}
      />
      <directionalLight ref={sun} position={[30, 45, 20]} intensity={2.4} />
      {/* faint constant fill so night is never pitch black */}
      <ambientLight intensity={0.12} color="#334866" />
      <NightStars />
    </>
  );
}

function NightStars() {
  const { nightT } = useCity();
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = nightT.current > 0.35;
  });
  return (
    <group ref={group} visible={false}>
      <Stars radius={180} depth={40} count={1500} factor={5} fade speed={0.6} />
    </group>
  );
}

/**
 * Rolling FPS check (starts after a 4s warm-up). Five consecutive
 * sub-25fps seconds triggers the switch-to-classic prompt once.
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

export function CityScene({ onLowFps }: { onLowFps: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [11, 15, 30], fov: 42, near: 0.5, far: 220 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows={false}
      aria-label="Electronic City 3D scene"
    >
      <Environment />
      <Ground />
      <Buildings />
      <Kiosks />
      <Streetlights />
      <StreetSigns />
      <GithubBuilding />
      <Park />
      <Nila />
      <Player />
      <Rain />
      <PerfMonitor onLowFps={onLowFps} />
    </Canvas>
  );
}
