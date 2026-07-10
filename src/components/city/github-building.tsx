"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useCity } from "./city-context";
import { GITHUB_BUILDING } from "./layout-data";
import { createFacadeTextures } from "./textures";
import { LEVEL_COLORS, type ContribData } from "./github-data";

const LEVEL_GLOW = ["#000000", "#1f3a5c", "#2c5c8c", "#3b82c9", "#63a9ff"];

const COLS = 12;
const ROWS = 30;
const CELL = 16;
const GAP = 3;

/**
 * Bakes the real contribution calendar into a canvas texture: one cell
 * per day, most recent day nearest the roofline (the tower "grows"
 * upward through the year). Falls back to a generic office facade
 * until the data arrives.
 */
function createContributionFacade(data: ContribData): {
  map: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
} {
  const width = COLS * (CELL + GAP);
  const height = ROWS * (CELL + GAP);

  const wall = document.createElement("canvas");
  wall.width = width;
  wall.height = height;
  const wallCtx = wall.getContext("2d")!;
  wallCtx.fillStyle = "#0f1624";
  wallCtx.fillRect(0, 0, width, height);

  const glow = document.createElement("canvas");
  glow.width = width;
  glow.height = height;
  const glowCtx = glow.getContext("2d")!;
  glowCtx.fillStyle = "#000000";
  glowCtx.fillRect(0, 0, width, height);

  const slice = data.days.slice(-COLS * ROWS);
  for (let i = 0; i < slice.length; i++) {
    const col = i % COLS;
    const rowFromBottom = Math.floor(i / COLS);
    const row = ROWS - 1 - rowFromBottom; // most recent days near the top
    if (row < 0) continue;
    const x = col * (CELL + GAP) + GAP / 2;
    const y = row * (CELL + GAP) + GAP / 2;
    const level = slice[i]?.level ?? 0;
    wallCtx.fillStyle = LEVEL_COLORS[level];
    wallCtx.fillRect(x, y, CELL, CELL);
    glowCtx.fillStyle = LEVEL_GLOW[level];
    glowCtx.fillRect(x, y, CELL, CELL);
  }

  const map = new THREE.CanvasTexture(wall);
  map.colorSpace = THREE.SRGBColorSpace;
  const emissiveMap = new THREE.CanvasTexture(glow);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

export function GithubBuilding() {
  const { setPanel, moveCommand, nightT, githubData } = useCity();
  const [hover, setHover] = useState(false);
  const winMat = useRef<THREE.MeshStandardMaterial>(null);
  const trimMat = useRef<THREE.MeshStandardMaterial>(null);
  const [w, h, d] = GITHUB_BUILDING.size;

  const fallback = useMemo(() => createFacadeTextures(), []);
  const contribFacade = useMemo(
    () => (githubData ? createContributionFacade(githubData) : null),
    [githubData]
  );
  const facade = contribFacade ?? fallback;

  useFrame(() => {
    const t = nightT.current;
    if (winMat.current) {
      // baseline is higher than a normal building: the grid should read
      // clearly in daylight, since the color itself IS the data
      winMat.current.emissiveIntensity = 0.35 + t * 1.8 + (hover ? 0.25 : 0);
    }
    if (trimMat.current) {
      trimMat.current.emissiveIntensity = (0.6 + t * 2.4) * (hover ? 1.8 : 1);
    }
  });

  function onClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    moveCommand.current = GITHUB_BUILDING.doorstep;
    setPanel("github");
  }

  return (
    <group
      position={[GITHUB_BUILDING.position[0], 0, GITHUB_BUILDING.position[1]]}
      rotation={[0, GITHUB_BUILDING.rotationY, 0]}
    >
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
        <meshStandardMaterial
          ref={winMat}
          map={facade.map}
          emissiveMap={facade.emissiveMap}
          emissive="#63a9ff"
          emissiveIntensity={0.35}
          color="#12181f"
          roughness={0.8}
        />
      </mesh>
      {/* roof cap */}
      <mesh position={[0, h + 0.18, 0]}>
        <boxGeometry args={[w + 0.5, 0.35, d + 0.5]} />
        <meshStandardMaterial color="#0b111c" roughness={1} />
      </mesh>
      {/* rooftop beacon — a small always-on marker so the tower reads
          as a landmark from across the city */}
      <mesh position={[0, h + 0.8, 0]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#63a9ff" emissive="#63a9ff" emissiveIntensity={1.6} />
      </mesh>
      {/* neon trim */}
      <mesh position={[0, h - 0.6, d / 2 + 0.06]}>
        <boxGeometry args={[w * 0.85, 0.22, 0.08]} />
        <meshStandardMaterial
          ref={trimMat}
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* entrance */}
      <mesh position={[0, 1.4, d / 2 + 0.05]}>
        <boxGeometry args={[2.2, 2.8, 0.1]} />
        <meshStandardMaterial color="#0a0f18" emissive="#3b82f6" emissiveIntensity={0.15} />
      </mesh>
      {/* blob shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[w + 2.5, d + 2.5]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
      {hover && (
        <Html position={[0, h + 2.2, 0]} center zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-line bg-surface/95 px-3 py-1 font-mono text-xs text-slate-100 shadow-card">
            GitHub — {githubData ? `${githubData.total.toLocaleString()} contributions` : "loading…"}
          </div>
        </Html>
      )}
    </group>
  );
}

