"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useCity } from "./city-context";
import { buildings, buildPath, SPAWN } from "./layout-data";

const SPEED = 9; // units/sec
const CAM_OFFSET = new THREE.Vector3(11, 15, 12);
const ZOOM_MIN = 0.45; // closest — mostly used near buildings
const ZOOM_MAX = 2.2; // farthest — wide view of the block
const ZOOM_SPEED = 0.0016;

/**
 * Click-to-move rover + follow camera.
 * Consumes moveCommand from context each frame; when a project is
 * selected the camera glides to that building's doorstep view instead
 * of following the player.
 */
export function Player() {
  const { moveCommand, playerPos, selected } = useCity();
  const group = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Mesh>(null);

  const state = useRef({
    pos: new THREE.Vector3(SPAWN[0], 0, SPAWN[1]),
    waypoints: [] as THREE.Vector3[],
    heading: Math.PI,
    camPos: new THREE.Vector3(SPAWN[0] + CAM_OFFSET.x, CAM_OFFSET.y, SPAWN[1] + CAM_OFFSET.z),
    camLook: new THREE.Vector3(SPAWN[0], 1, SPAWN[1]),
    markerT: 0,
    zoom: 1,
  });

  // scroll-wheel zoom: adjusts camera distance, clamped to a sane range
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = state.current;
      s.zoom = THREE.MathUtils.clamp(
        s.zoom + e.deltaY * ZOOM_SPEED,
        ZOOM_MIN,
        ZOOM_MAX
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl]);

  const focusView = useMemo(() => {
    if (!selected) return null;
    const def = buildings.find((b) => b.project.slug === selected.slug);
    if (!def) return null;
    const center = new THREE.Vector3(def.position[0], def.size[1] * 0.35, def.position[1]);
    const door = new THREE.Vector3(def.doorstep[0], 0, def.doorstep[1]);
    const out = door.clone().sub(new THREE.Vector3(def.position[0], 0, def.position[1]));
    out.y = 0;
    out.normalize();
    return { door, out, center };
  }, [selected]);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const s = state.current;

    // consume new click target
    if (moveCommand.current) {
      const target = moveCommand.current;
      moveCommand.current = null;
      s.waypoints = buildPath([s.pos.x, s.pos.z], target).map(
        ([x, z]) => new THREE.Vector3(x, 0, z)
      );
      s.markerT = 1;
      if (marker.current) {
        const last = s.waypoints[s.waypoints.length - 1];
        marker.current.position.set(last.x, 0.05, last.z);
      }
    }

    // advance along waypoints
    let moving = false;
    if (s.waypoints.length > 0) {
      const next = s.waypoints[0];
      const dir = next.clone().sub(s.pos);
      dir.y = 0;
      const dist = dir.length();
      if (dist < 0.15) {
        s.waypoints.shift();
      } else {
        moving = true;
        dir.normalize();
        s.pos.addScaledVector(dir, Math.min(SPEED * delta, dist));
        const targetHeading = Math.atan2(dir.x, dir.z);
        let dh = targetHeading - s.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        s.heading += dh * Math.min(1, delta * 10);
      }
    }

    playerPos.current.x = s.pos.x;
    playerPos.current.z = s.pos.z;

    if (group.current) {
      group.current.position.copy(s.pos);
      group.current.rotation.y = s.heading;
      // gentle bob while moving
      group.current.position.y = moving ? Math.abs(Math.sin(performance.now() / 90)) * 0.06 : 0;
    }
    if (wheels.current && moving) {
      wheels.current.children.forEach((w) => {
        w.rotation.x += delta * SPEED * 1.6;
      });
    }

    // destination marker fade
    if (marker.current) {
      s.markerT = Math.max(0, s.markerT - delta * 0.6);
      const m = marker.current.material as THREE.MeshBasicMaterial;
      m.opacity = s.markerT * 0.7;
      marker.current.scale.setScalar(1 + (1 - s.markerT) * 0.8);
    }

    // camera: follow player, or glide to focused building — both
    // respect the scroll-wheel zoom factor
    let wantPos: THREE.Vector3;
    let wantLook: THREE.Vector3;
    if (focusView) {
      const dist = 11 * s.zoom;
      wantPos = focusView.door.clone().add(focusView.out.clone().multiplyScalar(dist));
      wantPos.y = THREE.MathUtils.clamp(7.5 * s.zoom, 2.5, 16);
      wantLook = focusView.center;
    } else {
      wantPos = s.pos.clone().add(CAM_OFFSET.clone().multiplyScalar(s.zoom));
      wantLook = new THREE.Vector3(s.pos.x, 1, s.pos.z);
    }
    const k = 1 - Math.pow(0.0015, delta); // framerate-independent lerp
    s.camPos.lerp(wantPos, k);
    s.camLook.lerp(wantLook, k);
    camera.position.copy(s.camPos);
    camera.lookAt(s.camLook);
  });

  return (
    <>
      <group ref={group} position={[SPAWN[0], 0, SPAWN[1]]}>
        {/* rover body */}
        <mesh position={[0, 0.62, 0]}>
          <boxGeometry args={[0.9, 0.5, 1.25]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* cabin */}
        <mesh position={[0, 1.02, 0.12]}>
          <boxGeometry args={[0.7, 0.4, 0.7]} />
          <meshStandardMaterial color="#1e2b40" roughness={0.3} />
        </mesh>
        {/* headlight strip */}
        <mesh position={[0, 0.66, 0.66]}>
          <boxGeometry args={[0.6, 0.12, 0.06]} />
          <meshStandardMaterial color="#e2f3ff" emissive="#bfe3ff" emissiveIntensity={1.6} />
        </mesh>
        {/* antenna */}
        <mesh position={[0.3, 1.45, -0.3]}>
          <cylinderGeometry args={[0.02, 0.02, 0.55, 5]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0.3, 1.75, -0.3]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.4} />
        </mesh>
        {/* wheels */}
        <group ref={wheels}>
          {(
            [
              [-0.5, 0.28, 0.42],
              [0.5, 0.28, 0.42],
              [-0.5, 0.28, -0.42],
              [0.5, 0.28, -0.42],
            ] as const
          ).map((p, i) => (
            <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.28, 0.28, 0.18, 12]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
          ))}
        </group>
        {/* blob shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[0.85, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.35} />
        </mesh>
      </group>

      {/* click destination marker */}
      <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} position={[SPAWN[0], 0.05, SPAWN[1]]}>
        <ringGeometry args={[0.5, 0.68, 24]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0} />
      </mesh>
    </>
  );
}
