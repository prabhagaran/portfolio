"use client";

import { Html } from "@react-three/drei";
import { PLAZA_HALF, STREET_HALF } from "./layout-data";

/** Street names for the two corridors crossing at the central plaza. */
const EW_STREET = "Circuit Avenue";
const NS_STREET = "Ampere Street";

interface SignDef {
  position: [number, number];
  label: string;
  arrow: string;
  accent: string;
}

const OFFSET = PLAZA_HALF + 4;
// push the post off the roadway onto the "sidewalk" — just past the
// street's walkable half-width, not on the centerline
const SIDE = STREET_HALF + 1.2;

const SIGNS: SignDef[] = [
  { position: [OFFSET, SIDE], label: EW_STREET, arrow: "→", accent: "#3b82f6" },
  { position: [-OFFSET, SIDE], label: EW_STREET, arrow: "←", accent: "#3b82f6" },
  { position: [SIDE, -OFFSET], label: NS_STREET, arrow: "↑", accent: "#10b981" },
  { position: [SIDE, OFFSET], label: NS_STREET, arrow: "↓", accent: "#10b981" },
];

function SignPost({ def }: { def: SignDef }) {
  return (
    <group position={[def.position[0], 0, def.position[1]]}>
      {/* pole */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 2.6, 8]} />
        <meshStandardMaterial color="#2a3547" roughness={0.6} metalness={0.25} />
      </mesh>
      {/* blade backdrop */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[1.9, 0.44, 0.06]} />
        <meshStandardMaterial
          color="#121821"
          roughness={0.5}
          emissive={def.accent}
          emissiveIntensity={0.12}
        />
      </mesh>
      {/* accent edge */}
      <mesh position={[0, 2.5, 0.035]}>
        <boxGeometry args={[1.9, 0.05, 0.01]} />
        <meshStandardMaterial color={def.accent} emissive={def.accent} emissiveIntensity={0.6} />
      </mesh>
      <Html position={[0, 2.5, 0.05]} center zIndexRange={[10, 0]} occlude={false}>
        <div
          className="pointer-events-none flex items-center gap-1.5 whitespace-nowrap rounded-[6px] px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-slate-100"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}
        >
          <span style={{ color: def.accent }}>{def.arrow}</span>
          {def.label.toUpperCase()}
        </div>
      </Html>
      {/* base shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.4, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

/** Street name signs at each approach to the central plaza intersection. */
export function StreetSigns() {
  return (
    <group>
      {SIGNS.map((def, i) => (
        <SignPost key={i} def={def} />
      ))}
    </group>
  );
}
