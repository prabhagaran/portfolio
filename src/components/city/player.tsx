"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useCity } from "./city-context";
import { buildings, buildPath, isWalkable, SPAWN } from "./layout-data";

const SPEED = 9; // units/sec — waypoint (mouse) travel speed
const FORWARD_SPEED = 9; // units/sec — keyboard throttle forward
const REVERSE_SPEED = 5; // units/sec — keyboard throttle reverse, slower like a real car
const TURN_RATE = 2.8; // rad/sec — keyboard steering rate
const CAM_OFFSET = new THREE.Vector3(11, 15, 12);
const ZOOM_MIN = 0.45; // closest — mostly used near buildings
const ZOOM_MAX = 2.2; // farthest — wide view of the block
const ZOOM_SPEED = 0.0016;
const EYE_HEIGHT = 1.35;

// Car-style controls: up/down throttle forward/reverse along the
// current heading, left/right steer — nothing snaps sideways.
const KEY_MAP: Record<string, "forward" | "reverse" | "left" | "right"> = {
  ArrowUp: "forward",
  w: "forward",
  W: "forward",
  ArrowDown: "reverse",
  s: "reverse",
  S: "reverse",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
};

/**
 * Click-to-move rover + keyboard-driven rover, with a follow or
 * first-person (POV) camera. Consumes moveCommand from context each
 * frame for mouse/tap targets; arrow keys / WASD drive directly and
 * take priority while held. When a project is selected the camera
 * glides to that building's doorstep view regardless of view mode.
 */
export function Player() {
  const { moveCommand, playerPos, selected, panel, viewMode, toggleViewMode } = useCity();
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

  // keyboard state — refs so held keys don't trigger re-renders
  const keys = useRef({ forward: false, reverse: false, left: false, right: false });
  const panelOpenRef = useRef(false);
  useEffect(() => {
    panelOpenRef.current = Boolean(selected || panel);
    if (panelOpenRef.current) {
      keys.current = { forward: false, reverse: false, left: false, right: false };
    }
  }, [selected, panel]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.repeat && (e.key === "v" || e.key === "V")) {
        toggleViewMode();
        return;
      }
      if (panelOpenRef.current) return;
      const dir = KEY_MAP[e.key];
      if (!dir) return;
      keys.current[dir] = true;
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key];
      if (!dir) return;
      keys.current[dir] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [toggleViewMode]);

  // scroll-wheel zoom: adjusts camera distance, clamped to a sane range
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = state.current;
      s.zoom = THREE.MathUtils.clamp(s.zoom + e.deltaY * ZOOM_SPEED, ZOOM_MIN, ZOOM_MAX);
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

    const k = keys.current;
    const manualActive =
      !panelOpenRef.current && (k.forward || k.reverse || k.left || k.right);

    let moving = false;

    if (manualActive) {
      // keyboard driving takes over — cancel any pending mouse path
      if (s.waypoints.length > 0) s.waypoints = [];
      s.markerT = 0;

      // steer — left/right rotate the heading directly, car-style
      if (k.left) s.heading += TURN_RATE * delta;
      if (k.right) s.heading -= TURN_RATE * delta;
      if (s.heading > Math.PI) s.heading -= Math.PI * 2;
      if (s.heading < -Math.PI) s.heading += Math.PI * 2;

      // throttle — forward/reverse translate along the current heading;
      // reversing does NOT spin the rover around, just like a real car
      let moveAmt = 0;
      if (k.forward && !k.reverse) moveAmt = FORWARD_SPEED * delta;
      else if (k.reverse && !k.forward) moveAmt = -REVERSE_SPEED * delta;

      if (moveAmt !== 0) {
        const dir = new THREE.Vector3(Math.sin(s.heading), 0, Math.cos(s.heading));
        const testX = s.pos.x + dir.x * moveAmt;
        const testZ = s.pos.z + dir.z * moveAmt;
        let nx = s.pos.x;
        let nz = s.pos.z;
        if (isWalkable([testX, s.pos.z])) nx = testX;
        if (isWalkable([nx, testZ])) nz = testZ;
        if (nx !== s.pos.x || nz !== s.pos.z) {
          moving = true;
          s.pos.x = nx;
          s.pos.z = nz;
        }
      }
    } else {
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
    }

    playerPos.current.x = s.pos.x;
    playerPos.current.z = s.pos.z;

    if (group.current) {
      group.current.position.copy(s.pos);
      group.current.rotation.y = s.heading;
      // gentle bob while moving
      group.current.position.y = moving ? Math.abs(Math.sin(performance.now() / 90)) * 0.06 : 0;
      // hide the rover body in first-person so it doesn't occlude the view
      group.current.visible = !(viewMode === "pov" && !focusView);
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

    // camera: building focus overrides view mode; otherwise follow or POV
    let wantPos: THREE.Vector3;
    let wantLook: THREE.Vector3;
    let lerpBase = 0.0015;

    if (focusView) {
      const dist = 11 * s.zoom;
      wantPos = focusView.door.clone().add(focusView.out.clone().multiplyScalar(dist));
      wantPos.y = THREE.MathUtils.clamp(7.5 * s.zoom, 2.5, 16);
      wantLook = focusView.center;
    } else if (viewMode === "pov") {
      wantPos = new THREE.Vector3(s.pos.x, EYE_HEIGHT, s.pos.z);
      const lookDir = new THREE.Vector3(Math.sin(s.heading), 0, Math.cos(s.heading));
      wantLook = wantPos.clone().addScaledVector(lookDir, 8);
      lerpBase = 0.00004; // snappier — first-person lag reads as laggy input
    } else {
      wantPos = s.pos.clone().add(CAM_OFFSET.clone().multiplyScalar(s.zoom));
      wantLook = new THREE.Vector3(s.pos.x, 1, s.pos.z);
    }

    const lerpK = 1 - Math.pow(lerpBase, delta); // framerate-independent lerp
    s.camPos.lerp(wantPos, lerpK);
    s.camLook.lerp(wantLook, lerpK);
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
