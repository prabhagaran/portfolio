"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useCity } from "./city-context";
import {
  buildings,
  kiosks,
  clampToWalkable,
  EXTENT,
  STREET_HALF,
  SIDEWALK_WIDTH,
  FURNITURE_OFFSET,
  type BuildingDef,
  type KioskDef,
} from "./layout-data";
import {
  createFacadeTextures,
  createGroundTexture,
  createRoadTexture,
  createSidewalkTexture,
} from "./textures";

/* ---------------- ground + streets ---------------- */

export function Ground() {
  const { moveCommand } = useCity();
  const groundTex = useMemo(() => createGroundTexture(), []);
  const roadTex = useMemo(() => createRoadTexture(), []);
  const roadTexRepeat = useMemo(() => {
    const t = roadTex.clone();
    t.needsUpdate = true;
    t.repeat.set(EXTENT / 9, 1);
    return t;
  }, [roadTex]);
  const crossTex = useMemo(() => {
    const t = roadTex.clone();
    t.needsUpdate = true;
    t.repeat.set(EXTENT / 9, 1);
    t.rotation = Math.PI / 2;
    t.center.set(0.5, 0.5);
    return t;
  }, [roadTex]);
  const sidewalkTex = useMemo(() => createSidewalkTexture(), []);
  const sidewalkLong = useMemo(() => {
    const t = sidewalkTex.clone();
    t.needsUpdate = true;
    t.repeat.set((EXTENT * 2) / 3, SIDEWALK_WIDTH / 2.4);
    return t;
  }, [sidewalkTex]);
  const sidewalkCross = useMemo(() => {
    const t = sidewalkTex.clone();
    t.needsUpdate = true;
    t.repeat.set(SIDEWALK_WIDTH / 2.4, (EXTENT * 2) / 3);
    return t;
  }, [sidewalkTex]);

  function onClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    moveCommand.current = clampToWalkable([e.point.x, e.point.z]);
  }

  return (
    <group>
      {/* base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} onClick={onClick}>
        <planeGeometry args={[EXTENT * 2 + 30, EXTENT * 2 + 30]} />
        <meshStandardMaterial map={groundTex} roughness={1} />
      </mesh>
      {/* main street (E-W) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={onClick}>
        <planeGeometry args={[EXTENT * 2, STREET_HALF * 2]} />
        <meshStandardMaterial map={roadTexRepeat} roughness={0.9} />
      </mesh>
      {/* cross street (N-S) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        onClick={onClick}
      >
        <planeGeometry args={[STREET_HALF * 2, EXTENT * 2]} />
        <meshStandardMaterial map={crossTex} roughness={0.9} transparent />
      </mesh>
      {/* sidewalks flanking the main street */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.008, STREET_HALF + SIDEWALK_WIDTH / 2]}
        onClick={onClick}
      >
        <planeGeometry args={[EXTENT * 2, SIDEWALK_WIDTH]} />
        <meshStandardMaterial map={sidewalkLong} roughness={0.95} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.008, -(STREET_HALF + SIDEWALK_WIDTH / 2)]}
        onClick={onClick}
      >
        <planeGeometry args={[EXTENT * 2, SIDEWALK_WIDTH]} />
        <meshStandardMaterial map={sidewalkLong} roughness={0.95} />
      </mesh>
      {/* sidewalks flanking the cross street */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[STREET_HALF + SIDEWALK_WIDTH / 2, 0.009, 0]}
        onClick={onClick}
      >
        <planeGeometry args={[SIDEWALK_WIDTH, EXTENT * 2]} />
        <meshStandardMaterial map={sidewalkCross} roughness={0.95} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-(STREET_HALF + SIDEWALK_WIDTH / 2), 0.009, 0]}
        onClick={onClick}
      >
        <planeGeometry args={[SIDEWALK_WIDTH, EXTENT * 2]} />
        <meshStandardMaterial map={sidewalkCross} roughness={0.95} />
      </mesh>
    </group>
  );
}

/* ---------------- buildings ---------------- */

function Building({ def }: { def: BuildingDef }) {
  const { setSelected, moveCommand, nightT } = useCity();
  const [hover, setHover] = useState(false);
  const facade = useMemo(() => createFacadeTextures(), []);
  const winMat = useRef<THREE.MeshStandardMaterial>(null);
  const trimMat = useRef<THREE.MeshStandardMaterial>(null);
  const [w, h, d] = def.size;

  useFrame(() => {
    const t = nightT.current;
    if (winMat.current) {
      winMat.current.emissiveIntensity = 0.08 + t * 1.5 + (hover ? 0.25 : 0);
    }
    if (trimMat.current) {
      trimMat.current.emissiveIntensity = (0.5 + t * 2.2) * (hover ? 1.8 : 1);
    }
  });

  function onClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    moveCommand.current = def.doorstep;
    setSelected(def.project);
  }

  const sideMat = (
    <meshStandardMaterial
      ref={winMat}
      map={facade.map}
      emissiveMap={facade.emissiveMap}
      emissive="#ffd9a0"
      emissiveIntensity={0.08}
      color={def.color}
      roughness={0.85}
    />
  );

  return (
    <group position={[def.position[0], 0, def.position[1]]} rotation={[0, def.rotationY, 0]}>
      {/* body — one material for all sides via facade texture */}
      <mesh
        position={[0, h / 2, 0]}
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
        <boxGeometry args={[w, h, d]} />
        {sideMat}
      </mesh>
      {/* roof cap */}
      <mesh position={[0, h + 0.15, 0]}>
        <boxGeometry args={[w + 0.4, 0.3, d + 0.4]} />
        <meshStandardMaterial color="#0b111c" roughness={1} />
      </mesh>
      {/* neon trim near roof */}
      <mesh position={[0, h - 0.6, d / 2 + 0.06]}>
        <boxGeometry args={[w * 0.85, 0.22, 0.08]} />
        <meshStandardMaterial
          ref={trimMat}
          color={def.accent}
          emissive={def.accent}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* entrance */}
      <mesh position={[0, 1.4, d / 2 + 0.05]}>
        <boxGeometry args={[2.2, 2.8, 0.1]} />
        <meshStandardMaterial color="#0a0f18" emissive={def.accent} emissiveIntensity={0.15} />
      </mesh>
      {/* fake blob shadow (cheaper than shadow maps) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[w + 2.5, d + 2.5]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
      {/* hover label */}
      {hover && (
        <Html position={[0, h + 2.2, 0]} center zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-line bg-surface/95 px-3 py-1 font-mono text-xs text-slate-100 shadow-card">
            {def.project.name}
          </div>
        </Html>
      )}
    </group>
  );
}

export function Buildings() {
  return (
    <group>
      {buildings.map((b) => (
        <Building key={b.project.slug} def={b} />
      ))}
    </group>
  );
}

/* ---------------- info kiosks (About / Contact / Resume districts) ---------------- */

function Kiosk({ def }: { def: KioskDef }) {
  const { setPanel, moveCommand, nightT } = useCity();
  const [hover, setHover] = useState(false);
  const mat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (mat.current) {
      mat.current.emissiveIntensity = (0.7 + nightT.current * 1.8) * (hover ? 1.8 : 1);
    }
  });

  function onClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    moveCommand.current = clampToWalkable(def.position);
    setPanel(def.id);
  }

  return (
    <group position={[def.position[0], 0, def.position[1]]}>
      <mesh
        position={[0, 1.1, 0]}
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
        <boxGeometry args={[1.4, 2.2, 0.5]} />
        <meshStandardMaterial color="#16202f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.7, 0.28]}>
        <planeGeometry args={[1.1, 0.9]} />
        <meshStandardMaterial
          ref={mat}
          color={def.accent}
          emissive={def.accent}
          emissiveIntensity={0.7}
        />
      </mesh>
      <Html position={[0, 2.9, 0]} center zIndexRange={[10, 0]}>
        <div
          className="pointer-events-none whitespace-nowrap rounded-full border border-line bg-surface/95 px-2.5 py-0.5 font-mono text-[11px] text-slate-100 shadow-card"
          style={{ borderColor: hover ? def.accent : undefined }}
        >
          {def.label}
        </div>
      </Html>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[2.4, 1.6]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export function Kiosks() {
  return (
    <group>
      {kiosks.map((k) => (
        <Kiosk key={k.id} def={k} />
      ))}
    </group>
  );
}

/* ---------------- streetlights ---------------- */

// Street-side lamps sit at FURNITURE_OFFSET — past the sidewalk's
// outer edge, clear of where pedestrians actually walk.
const LAMP_POSITIONS: [number, number][] = [
  [-36, -FURNITURE_OFFSET], [-20, FURNITURE_OFFSET], [20, -FURNITURE_OFFSET], [36, FURNITURE_OFFSET],
  [-FURNITURE_OFFSET, -20], [FURNITURE_OFFSET, -36], [-FURNITURE_OFFSET, 36], [FURNITURE_OFFSET, 20],
  [-10.5, -10.5], [10.5, 10.5],
];

// Only the four plaza corners carry real point lights; the rest glow
// via emissive heads. Keeps per-pixel light cost flat on integrated GPUs.
const LIT_LAMPS = new Set([8, 9, 1, 2]);

function Lamp({ pos, lit }: { pos: [number, number]; lit: boolean }) {
  const { nightT } = useCity();
  const head = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const t = nightT.current;
    if (head.current) head.current.emissiveIntensity = 0.1 + t * 3.2;
    if (light.current) light.current.intensity = t * 55;
  });

  return (
    <group position={[pos[0], 0, pos[1]]}>
      <mesh position={[0, 1.9, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 3.8, 6]} />
        <meshStandardMaterial color="#2a3547" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.9, 0]}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial ref={head} color="#fde68a" emissive="#ffd9a0" emissiveIntensity={0.1} />
      </mesh>
      {lit && (
        <pointLight
          ref={light}
          position={[0, 3.9, 0]}
          color="#ffd9a0"
          intensity={0}
          distance={26}
          decay={1.6}
        />
      )}
    </group>
  );
}

export function Streetlights() {
  return (
    <group>
      {LAMP_POSITIONS.map((p, i) => (
        <Lamp key={i} pos={p} lit={LIT_LAMPS.has(i)} />
      ))}
    </group>
  );
}
