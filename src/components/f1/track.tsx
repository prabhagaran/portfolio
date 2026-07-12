"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { createGroundTexture, createLEDBannerTexture } from "../city/textures";
import { createCheckerTexture, createTrackTexture } from "./textures";
import {
  EXTENT_X,
  EXTENT_Z,
  SAMPLE_COUNT,
  START_U,
  TRACK_HALF,
  TRACK_LENGTH,
  TRIGGER_RADIUS,
  pitWorlds,
  samples,
  trackCurve,
  type PitWorld,
} from "./track-data";

/** Left-hand normal of a tangent: (x,z) → (z,-x). */
const ln = (tx: number, tz: number): [number, number] => [tz, -tx];

/* ---------------- ground ---------------- */

export function Ground() {
  const tex = useMemo(() => createGroundTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
      <planeGeometry args={[EXTENT_X * 2.4, EXTENT_Z * 2.8]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
}

/* ---------------- racing surface ---------------- */

export function TrackRibbon() {
  const tex = useMemo(() => createTrackTexture(), []);

  const geometry = useMemo(() => {
    const rows = SAMPLE_COUNT + 1; // +1 duplicates the seam for clean UVs
    const positions = new Float32Array(rows * 2 * 3);
    const normals = new Float32Array(rows * 2 * 3);
    const uvs = new Float32Array(rows * 2 * 2);
    const arcStep = TRACK_LENGTH / SAMPLE_COUNT;

    for (let i = 0; i < rows; i++) {
      const s = samples[i % SAMPLE_COUNT];
      const [nx, nz] = ln(s.tx, s.tz);
      const v = (i * arcStep) / 12; // tile the texture every 12 units
      for (let side = 0; side < 2; side++) {
        const sign = side === 0 ? 1 : -1;
        const o = (i * 2 + side) * 3;
        positions[o] = s.x + nx * TRACK_HALF * sign;
        positions[o + 1] = 0.02;
        positions[o + 2] = s.z + nz * TRACK_HALF * sign;
        normals[o + 1] = 1;
        uvs[(i * 2 + side) * 2] = side;
        uvs[(i * 2 + side) * 2 + 1] = v;
      }
    }

    const index: number[] = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(index);
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  );
}

/* ---------------- kerbs ---------------- */

/**
 * Red/white kerb blocks on the outside of every real corner, computed
 * from centerline curvature — mirrors the reference image, where kerbs
 * trace the loop, hairpin, switchback and chicane but no straights.
 */
export function Kerbs() {
  const { red, white } = useMemo(() => {
    const redM: THREE.Matrix4[] = [];
    const whiteM: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    let stripe = 0;

    for (let i = 0; i < SAMPLE_COUNT; i += 2) {
      const a = samples[(i - 2 + SAMPLE_COUNT) % SAMPLE_COUNT];
      const b = samples[(i + 2) % SAMPLE_COUNT];
      // turn angle between tangents over ~4 samples (≈4 units of arc)
      const crossY = a.tz * b.tx - a.tx * b.tz;
      const dot = a.tx * b.tx + a.tz * b.tz;
      const dTheta = Math.atan2(crossY, dot);
      if (Math.abs(dTheta) < 0.07) continue; // radius > ~60u: not a corner

      const s = samples[i];
      const [nx, nz] = ln(s.tx, s.tz);
      // crossY > 0 = left turn, kerb goes on the right (outside)
      const sign = crossY > 0 ? -1 : 1;
      const off = TRACK_HALF + 0.62;
      q.setFromAxisAngle(up, Math.atan2(s.tx, s.tz));
      m.compose(
        new THREE.Vector3(s.x + nx * off * sign, 0.045, s.z + nz * off * sign),
        q,
        new THREE.Vector3(1, 1, 1)
      );
      (stripe++ % 2 === 0 ? redM : whiteM).push(m.clone());
    }
    return { red: redM, white: whiteM };
  }, []);

  const setMatrices = (mats: THREE.Matrix4[]) => (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    mats.forEach((mat, i) => mesh.setMatrixAt(i, mat));
    mesh.instanceMatrix.needsUpdate = true;
  };

  return (
    <>
      <instancedMesh ref={setMatrices(red)} args={[undefined, undefined, red.length]}>
        <boxGeometry args={[1.15, 0.09, 2.05]} />
        <meshStandardMaterial color="#d23b3b" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={setMatrices(white)} args={[undefined, undefined, white.length]}>
        <boxGeometry args={[1.15, 0.09, 2.05]} />
        <meshStandardMaterial color="#e8ecf1" roughness={0.7} />
      </instancedMesh>
    </>
  );
}

/* ---------------- start/finish ---------------- */

export function StartFinish() {
  const checker = useMemo(() => createCheckerTexture(), []);
  const banner = useMemo(
    () => createLEDBannerTexture("Portfolio Grand Prix · lights out!", "#3b82f6"),
    []
  );
  const bannerMat = useRef<THREE.MeshBasicMaterial>(null);

  const frame = useMemo(() => {
    const p = trackCurve.getPointAt(START_U);
    const t = trackCurve.getTangentAt(START_U);
    return { x: p.x, z: p.z, yaw: Math.atan2(t.x, t.z) };
  }, []);

  useFrame((_, delta) => {
    if (bannerMat.current?.map) bannerMat.current.map.offset.x += delta * 0.1;
  });

  const postX = TRACK_HALF + 1.6;

  return (
    <group position={[frame.x, 0, frame.z]} rotation={[0, frame.yaw, 0]}>
      {/* checkered strip across the road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <planeGeometry args={[TRACK_HALF * 2, 2.4]} />
        <meshBasicMaterial map={checker} toneMapped={false} />
      </mesh>
      {/* gantry posts + beam */}
      {[postX, -postX].map((x) => (
        <mesh key={x} position={[x, 3.2, 0]}>
          <boxGeometry args={[0.35, 6.4, 0.35]} />
          <meshStandardMaterial color="#2a3547" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 6.2, 0]}>
        <boxGeometry args={[postX * 2 + 0.35, 0.5, 0.6]} />
        <meshStandardMaterial color="#2a3547" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* scrolling LED banner on the beam, readable from the grid */}
      <mesh position={[0, 5.45, 0.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[postX * 2, 0.9]} />
        <meshBasicMaterial ref={bannerMat} map={banner} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ---------------- pit garages ---------------- */

function PitGarage({ pit }: { pit: PitWorld }) {
  const banner = useMemo(
    () => createLEDBannerTexture(pit.def.label, pit.def.accent),
    [pit]
  );
  const bannerMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }, delta) => {
    if (bannerMat.current?.map) bannerMat.current.map.offset.x += delta * 0.12;
    // slow breathing pulse so the apron reads as "drive in here"
    if (ringMat.current)
      ringMat.current.opacity = 0.4 + Math.sin(clock.elapsedTime * 2.2) * 0.18;
  });

  return (
    <group>
      {/* garage building, front facing the track — lab/workshop styling */}
      <group position={[pit.garageX, 0, pit.garageZ]} rotation={[0, pit.yaw, 0]}>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[11, 4.4, 6]} />
          <meshStandardMaterial color="#2b3a52" roughness={0.6} />
        </mesh>
        {/* roof accent */}
        <mesh position={[0, 4.55, 0]}>
          <boxGeometry args={[11.2, 0.3, 6.2]} />
          <meshStandardMaterial
            color={pit.def.accent}
            emissive={pit.def.accent}
            emissiveIntensity={0.35}
            roughness={0.5}
          />
        </mesh>
        {/* open garage door */}
        <mesh position={[0, 1.7, 3.02]}>
          <planeGeometry args={[6.5, 3.1]} />
          <meshBasicMaterial color="#05070c" />
        </mesh>
        {/* scrolling LED sign above the door */}
        <mesh position={[0, 3.85, 3.05]}>
          <planeGeometry args={[8.5, 1]} />
          <meshBasicMaterial ref={bannerMat} map={banner} toneMapped={false} />
        </mesh>
        {/* tall totem so the section is identifiable from across the track */}
        <mesh position={[6.8, 4, 1.5]}>
          <cylinderGeometry args={[0.14, 0.2, 8, 8]} />
          <meshStandardMaterial color="#2a3547" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[6.8, 8.3, 1.5]}>
          <boxGeometry args={[3.6, 1.5, 0.4]} />
          <meshStandardMaterial
            color="#0f1624"
            emissive={pit.def.accent}
            emissiveIntensity={0.25}
            roughness={0.5}
          />
        </mesh>
        <Html position={[6.8, 8.3, 1.8]} center zIndexRange={[10, 0]} occlude={false}>
          <div
            className="pointer-events-none whitespace-nowrap rounded-[6px] px-2 py-0.5 font-mono text-[12px] font-bold uppercase tracking-[0.18em]"
            style={{ color: pit.def.accent, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
          >
            {pit.def.label}
          </div>
        </Html>
      </group>

      {/* pit apron — the drive-into trigger zone on the tarmac */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pit.triggerX, 0.03, pit.triggerZ]}>
        <circleGeometry args={[TRIGGER_RADIUS - 1.5, 28]} />
        <meshBasicMaterial color={pit.def.accent} transparent opacity={0.12} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pit.triggerX, 0.04, pit.triggerZ]}>
        <ringGeometry args={[TRIGGER_RADIUS - 1.9, TRIGGER_RADIUS - 1.5, 36]} />
        <meshBasicMaterial ref={ringMat} color={pit.def.accent} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export function PitGarages() {
  return (
    <group>
      {pitWorlds.map((pit) => (
        <PitGarage key={pit.def.id} pit={pit} />
      ))}
    </group>
  );
}

/* ---------------- grandstand ---------------- */

/** One low-poly grandstand along the start/finish straight, for vibe. */
export function Grandstand() {
  const seatColors = ["#3b82f6", "#10b981", "#f59e0b", "#3b82f6"];
  return (
    <group position={[-30, 0, 60]}>
      {/* stepped tiers rising away from the track (track is at -z) */}
      {seatColors.map((c, i) => (
        <group key={i}>
          <mesh position={[0, 0.5 + i * 0.9, i * 1.6]}>
            <boxGeometry args={[30, 1 + i * 1.8, 1.6]} />
            <meshStandardMaterial color="#243248" roughness={0.7} />
          </mesh>
          {/* seat row on top of each tier */}
          <mesh position={[0, 1.15 + i * 1.8, i * 1.6]}>
            <boxGeometry args={[29.4, 0.3, 1.3]} />
            <meshStandardMaterial color={c} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
