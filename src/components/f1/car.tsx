"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useF1 } from "./f1-context";
import {
  RUNOFF,
  TRACK_HALF,
  TRIGGER_RADIUS,
  nearestSampleIndex,
  pitWorlds,
  samples,
  spawn,
} from "./track-data";

/* Arcade tuning — responsive and fun, not simulation-grade (spec §4.3). */
const MAX_SPEED = 36; // u/s
const REVERSE_MAX = 9;
const ACCEL = 19;
const BRAKE = 44;
const REVERSE_ACCEL = 10;
const COAST_DRAG = 5.5; // u/s² when off throttle
const OFFTRACK_MAX = 11; // grass caps the speed hard
const OFFTRACK_DRAG = 26;
const STEER_BASE = 2.6; // rad/s at full grip
const STEER_HIGH_SPEED_LOSS = 0.5; // fraction of authority lost at top speed
const KMH = 7.8; // display conversion

const CAM_BACK = 9.5;
const CAM_UP = 4.3;
const CAM_LOOK_AHEAD = 7;
const FOV_BASE = 48;
const FOV_SPEED = 14;

const KEY_MAP: Record<string, "throttle" | "brake" | "left" | "right"> = {
  ArrowUp: "throttle",
  w: "throttle",
  W: "throttle",
  ArrowDown: "brake",
  s: "brake",
  S: "brake",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
};

/**
 * The player's car: kart-style physics along the digitized centerline
 * data, a chase camera with speed-reactive FOV, and pit-stop triggers.
 * Track limits follow the spec: grass drags the car down and eases it
 * back toward the tarmac instead of a hard stop or wall bounce.
 */
export function Car() {
  const { input, carPos, speedKmh, panel, setPanel, resetTick } = useF1();

  const group = useRef<THREE.Group>(null);
  const frontLeft = useRef<THREE.Group>(null);
  const frontRight = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group>(null);

  const state = useRef({
    x: spawn.x,
    z: spawn.z,
    heading: spawn.heading,
    v: 0,
    steer: 0, // smoothed -1..1
    nearIdx: -1,
    inPitZone: null as string | null,
    camPos: new THREE.Vector3(
      spawn.x - Math.sin(spawn.heading) * CAM_BACK,
      CAM_UP,
      spawn.z - Math.cos(spawn.heading) * CAM_BACK
    ),
    camLook: new THREE.Vector3(spawn.x, 1, spawn.z),
  });

  const panelRef = useRef<typeof panel>(panel);
  useEffect(() => {
    panelRef.current = panel;
    if (panel) {
      input.current = { left: false, right: false, throttle: false, brake: false };
    }
  }, [panel, input]);

  // "Back to grid"
  useEffect(() => {
    const s = state.current;
    s.x = spawn.x;
    s.z = spawn.z;
    s.heading = spawn.heading;
    s.v = 0;
    s.steer = 0;
    s.nearIdx = -1;
    s.inPitZone = null;
  }, [resetTick]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        // recover: snap back onto the nearest piece of track
        const s = state.current;
        const idx = nearestSampleIndex(s.x, s.z, s.nearIdx);
        const sm = samples[idx];
        s.x = sm.x;
        s.z = sm.z;
        s.heading = Math.atan2(sm.tx, sm.tz);
        s.v = 0;
        return;
      }
      const dir = KEY_MAP[e.key];
      if (!dir) return;
      if (panelRef.current) return;
      input.current[dir] = true;
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key];
      if (dir) input.current[dir] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [input]);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const s = state.current;
    const k = panelRef.current
      ? { left: false, right: false, throttle: false, brake: false }
      : input.current;

    // --- steering (smoothed toward the held direction) ---
    const steerTarget = (k.left ? 1 : 0) - (k.right ? 1 : 0);
    s.steer += (steerTarget - s.steer) * Math.min(1, delta * 8);
    const speedFrac = Math.abs(s.v) / MAX_SPEED;
    const authority =
      STEER_BASE * Math.min(1, Math.abs(s.v) / 7) * (1 - STEER_HIGH_SPEED_LOSS * speedFrac);
    s.heading += s.steer * authority * delta * (s.v >= 0 ? 1 : -1);

    // --- throttle / brake / reverse ---
    if (k.throttle && !k.brake) {
      s.v += ACCEL * (1 - Math.max(0, s.v) / MAX_SPEED) * delta;
    } else if (k.brake) {
      if (s.v > 0.3) s.v -= BRAKE * delta;
      else s.v = Math.max(-REVERSE_MAX, s.v - REVERSE_ACCEL * delta);
    } else {
      // coast down
      const drag = COAST_DRAG * delta;
      if (s.v > 0) s.v = Math.max(0, s.v - drag);
      else s.v = Math.min(0, s.v + drag);
    }

    // --- integrate position ---
    const dirX = Math.sin(s.heading);
    const dirZ = Math.cos(s.heading);
    s.x += dirX * s.v * delta;
    s.z += dirZ * s.v * delta;

    // --- track limits: slow + ease back on, never a hard stop ---
    s.nearIdx = nearestSampleIndex(s.x, s.z, s.nearIdx);
    const near = samples[s.nearIdx];
    const offX = s.x - near.x;
    const offZ = s.z - near.z;
    const dist = Math.hypot(offX, offZ);
    if (dist > TRACK_HALF + 0.5) {
      // rumble over the kerb line onto the grass: heavy drag…
      if (Math.abs(s.v) > OFFTRACK_MAX) {
        s.v -= Math.sign(s.v) * OFFTRACK_DRAG * delta;
      }
      // …and a gentle pull back toward the racing surface
      const pull = Math.min((dist - TRACK_HALF) * 1.6, 7) * delta;
      s.x -= (offX / dist) * pull;
      s.z -= (offZ / dist) * pull;
    }
    if (dist > TRACK_HALF + RUNOFF) {
      // invisible outer wall: slide along it, don't bounce
      const lim = TRACK_HALF + RUNOFF;
      s.x = near.x + (offX / dist) * lim;
      s.z = near.z + (offZ / dist) * lim;
      s.v *= 0.92;
    }

    // --- pit-stop triggers ---
    let zone: string | null = null;
    for (const pit of pitWorlds) {
      const dx = s.x - pit.triggerX;
      const dz = s.z - pit.triggerZ;
      if (dx * dx + dz * dz < TRIGGER_RADIUS * TRIGGER_RADIUS) {
        zone = pit.def.id;
        break;
      }
    }
    if (zone && zone !== s.inPitZone && !panelRef.current) {
      s.v = 0;
      setPanel(zone as Exclude<typeof panel, null>);
    }
    // tracked so that sitting in the zone after closing its panel
    // doesn't immediately retrigger it — you must leave and come back
    s.inPitZone = zone;

    // --- shared refs for the HUD ---
    carPos.current.x = s.x;
    carPos.current.z = s.z;
    carPos.current.heading = s.heading;
    speedKmh.current = Math.abs(s.v) * KMH;

    // --- car visuals ---
    if (group.current) {
      group.current.position.set(s.x, 0, s.z);
      group.current.rotation.y = s.heading;
      // lean into corners a touch
      group.current.rotation.z = -s.steer * Math.min(1, speedFrac * 2) * 0.05;
    }
    const wheelSpin = (s.v * delta) / 0.35;
    if (wheels.current) {
      wheels.current.children.forEach((w) => {
        // fronts are steerable groups — spin the wheel mesh inside them
        const target = w.children.length > 0 ? w.children[0] : w;
        target.rotation.x += wheelSpin;
      });
    }
    const steerAngle = s.steer * 0.38;
    if (frontLeft.current) frontLeft.current.rotation.y = steerAngle;
    if (frontRight.current) frontRight.current.rotation.y = steerAngle;

    // --- chase camera ---
    const wantPos = new THREE.Vector3(
      s.x - dirX * CAM_BACK,
      CAM_UP,
      s.z - dirZ * CAM_BACK
    );
    const wantLook = new THREE.Vector3(s.x + dirX * CAM_LOOK_AHEAD, 1, s.z + dirZ * CAM_LOOK_AHEAD);
    const lerpK = 1 - Math.pow(0.00006, delta); // framerate-independent
    s.camPos.lerp(wantPos, lerpK);
    s.camLook.lerp(wantLook, lerpK);
    camera.position.copy(s.camPos);
    camera.lookAt(s.camLook);

    const persp = camera as THREE.PerspectiveCamera;
    const targetFov = FOV_BASE + FOV_SPEED * speedFrac;
    if (Math.abs(persp.fov - targetFov) > 0.05) {
      persp.fov += (targetFov - persp.fov) * Math.min(1, delta * 5);
      persp.updateProjectionMatrix();
    }
  });

  return (
    <group ref={group} position={[spawn.x, 0, spawn.z]} rotation={[0, spawn.heading, 0]}>
      {/* tub (nose points +z, the direction of travel) */}
      <mesh position={[0, 0.36, 0.15]}>
        <boxGeometry args={[1.05, 0.34, 2.9]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.35} metalness={0.25} />
      </mesh>
      {/* nose cone */}
      <mesh position={[0, 0.33, 1.85]}>
        <boxGeometry args={[0.55, 0.24, 1.0]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.35} metalness={0.25} />
      </mesh>
      {/* front wing */}
      <mesh position={[0, 0.17, 2.3]}>
        <boxGeometry args={[2.0, 0.08, 0.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      {/* sidepods / engine cover */}
      <mesh position={[0, 0.52, -0.45]}>
        <boxGeometry args={[1.45, 0.3, 1.5]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* cockpit + helmet */}
      <mesh position={[0, 0.62, 0.35]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#10b981" roughness={0.3} />
      </mesh>
      {/* rear wing */}
      <mesh position={[0, 0.95, -1.5]}>
        <boxGeometry args={[1.6, 0.08, 0.45]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.72, -1.5]}>
          <boxGeometry args={[0.06, 0.5, 0.45]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
      ))}
      {/* wheels — fronts in steerable groups */}
      <group ref={wheels}>
        <group ref={frontLeft} position={[-0.78, 0.34, 1.15]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.34, 0.34, 0.32, 12]} />
            <meshStandardMaterial color="#0b0f14" roughness={0.9} />
          </mesh>
        </group>
        <group ref={frontRight} position={[0.78, 0.34, 1.15]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.34, 0.34, 0.32, 12]} />
            <meshStandardMaterial color="#0b0f14" roughness={0.9} />
          </mesh>
        </group>
        {[-0.82, 0.82].map((x) => (
          <mesh key={x} position={[x, 0.38, -1.05]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 0.42, 12]} />
            <meshStandardMaterial color="#0b0f14" roughness={0.9} />
          </mesh>
        ))}
      </group>
      {/* blob shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[1.7, 18]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} />
      </mesh>
    </group>
  );
}
