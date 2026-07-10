"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useCity } from "./city-context";
import {
  buildings,
  buildPath,
  isWalkable,
  kiosks,
  GITHUB_BUILDING,
  EXTENT,
  SPAWN,
} from "./layout-data";

const SPEED = 9; // units/sec — waypoint (mouse) travel speed
const FORWARD_SPEED = 9; // units/sec — keyboard throttle forward
const REVERSE_SPEED = 5; // units/sec — keyboard throttle reverse, slower like a real car
const TURN_RATE = 2.8; // rad/sec — keyboard steering rate
const CAM_OFFSET = new THREE.Vector3(11, 15, 12);
const ZOOM_MIN = 0.45; // closest — mostly used near buildings
const ZOOM_MAX = 2.2; // farthest — wide view of the block
const ZOOM_SPEED = 0.0016;
const EYE_HEIGHT = 1.35;

// Orbit
const ORBIT_RADIUS = Math.hypot(CAM_OFFSET.x, CAM_OFFSET.z);
const DEFAULT_ORBIT_YAW = Math.atan2(CAM_OFFSET.x, CAM_OFFSET.z);
const ORBIT_DRAG_SPEED = 0.006;

// Drone
const DRONE_SPEED = 14;
const DRONE_ALT_MIN = 4;
const DRONE_ALT_MAX = 60;
const DRONE_ALT_SPEED = 0.02;

// Satellite
const SAT_PAN_SPEED = 20;
const SAT_ALT_MIN = 20;
const SAT_ALT_MAX = 90;
const SAT_ALT_SPEED = 0.05;
const SAT_DEFAULT_ALT = 55;

// Guided tour
const TOUR_DWELL = 4.5; // seconds per stop

// Free look — right mouse button + drag, active in every camera mode
// except the scripted Guided Tour. It's persistent (stays wherever
// you leave it) rather than snapping back the instant you release the
// button; it only eases back toward "facing forward" while you're
// actively driving/flying, so steering never fights the view.
const LOOK_SPEED = 0.0055;
const LOOK_RECENTER_RATE = 6;
const POV_PITCH_LIMIT = 1.45; // near-vertical, enough to look up at towers
const DRONE_PITCH_LIMIT_UP = 1.0;
const DRONE_PITCH_LIMIT_DOWN = -1.45;
const DRONE_DEFAULT_PITCH = -0.25;
const CHASE_PITCH_LIMIT = 1.3; // Navigate / Orbit / Satellite look-around range
const LOOK_TARGET_DIST = 16;

// Street View zoom — scroll wheel narrows/widens the field of view,
// since a first-person rig has no "distance" to close in on.
const DEFAULT_FOV = 42;
const POV_FOV_MIN = 16; // zoomed in
const POV_FOV_MAX = 55; // zoomed out
const POV_FOV_SPEED = 0.03;
const FOV_EASE_RATE = 8;

// Car-style controls: up/down throttle forward/reverse along the
// current heading, left/right steer — nothing snaps sideways. In
// Drone View the same four keys fly the camera instead of the rover;
// in Satellite View they pan the top-down view.
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

interface TourStop {
  camPos: THREE.Vector3;
  look: THREE.Vector3;
  name: string;
}

function buildingShot(
  position: [number, number],
  doorstep: [number, number],
  size: [number, number, number],
  dist: number,
  camY: number
) {
  const center = new THREE.Vector3(position[0], size[1] * 0.35, position[1]);
  const door = new THREE.Vector3(doorstep[0], 0, doorstep[1]);
  const out = door.clone().sub(new THREE.Vector3(position[0], 0, position[1]));
  out.y = 0;
  out.normalize();
  const camPos = door.clone().add(out.clone().multiplyScalar(dist));
  camPos.y = camY;
  return { camPos, center };
}

/** Rotates a fixed look-at point around `pos` by a yaw/pitch offset. */
function applyLookOffset(
  pos: THREE.Vector3,
  target: THREE.Vector3,
  offsetYaw: number,
  offsetPitch: number,
  pitchLimit: number
): THREE.Vector3 {
  const dir = target.clone().sub(pos);
  const horiz = Math.max(0.0001, Math.hypot(dir.x, dir.z));
  const baseYaw = Math.atan2(dir.x, dir.z);
  const basePitch = Math.atan2(dir.y, horiz);
  const yaw = baseYaw + offsetYaw;
  const pitch = THREE.MathUtils.clamp(basePitch + offsetPitch, -pitchLimit, pitchLimit);
  const cosP = Math.cos(pitch);
  const outDir = new THREE.Vector3(Math.sin(yaw) * cosP, Math.sin(pitch), Math.cos(yaw) * cosP);
  return pos.clone().addScaledVector(outDir, LOOK_TARGET_DIST);
}

/**
 * Rover + camera rig for Electronic City. Supports six navigation
 * modes (Navigate, Street View, Orbit, Drone View, Satellite View,
 * Guided Tour) plus Return to Base. Mouse clicks always drive the
 * rover via waypoints; arrow keys/WASD drive the rover in Navigate,
 * Street View and Orbit, or fly free in Drone/pan in Satellite.
 * Right-click + drag free-looks in every mode but the scripted tour.
 * Selecting a project always shows its doorstep view, regardless of
 * the active camera mode.
 */
export function Player({
  onTourStop,
}: {
  onTourStop?: (name: string) => void;
}) {
  const {
    moveCommand,
    playerPos,
    selected,
    panel,
    viewMode,
    setViewMode,
    resetTick,
  } = useCity();
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
    orbitYaw: DEFAULT_ORBIT_YAW,
    dronePos: new THREE.Vector3(SPAWN[0] + CAM_OFFSET.x, CAM_OFFSET.y, SPAWN[1] + CAM_OFFSET.z),
    droneYaw: Math.PI,
    droneAlt: 12,
    satPos: new THREE.Vector3(SPAWN[0], 0, SPAWN[1]),
    satAlt: SAT_DEFAULT_ALT,
    tourIndex: 0,
    tourT: 0,
    povLookYaw: Math.PI,
    povLookPitch: 0,
    povFov: DEFAULT_FOV,
    droneLookYaw: Math.PI,
    droneLookPitch: DRONE_DEFAULT_PITCH,
    // shared free-look offset for Navigate / Orbit / Satellite, layered
    // on top of each mode's normal "look at the subject" behavior
    lookOffsetYaw: 0,
    lookOffsetPitch: 0,
  });

  // true while the right mouse button is held and dragging
  const freeLookDragging = useRef(false);

  // keyboard state — refs so held keys don't trigger re-renders
  const keys = useRef({ forward: false, reverse: false, left: false, right: false });
  const panelOpenRef = useRef(false);
  useEffect(() => {
    panelOpenRef.current = Boolean(selected || panel);
    if (panelOpenRef.current) {
      keys.current = { forward: false, reverse: false, left: false, right: false };
    }
  }, [selected, panel]);

  const viewModeRef = useRef(viewMode);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  const tourStops: TourStop[] = useMemo(() => {
    const stops: TourStop[] = [];
    for (const b of buildings) {
      const shot = buildingShot(b.position, b.doorstep, b.size, 11, 7.5);
      stops.push({ camPos: shot.camPos, look: shot.center, name: b.project.name });
    }
    const gh = buildingShot(
      GITHUB_BUILDING.position,
      GITHUB_BUILDING.doorstep,
      GITHUB_BUILDING.size,
      13,
      9
    );
    stops.push({ camPos: gh.camPos, look: gh.center, name: "GitHub Data Tower" });
    for (const k of kiosks) {
      const p = new THREE.Vector3(k.position[0], 0, k.position[1]);
      stops.push({
        camPos: p.clone().add(new THREE.Vector3(4, 4.5, 4)),
        look: new THREE.Vector3(p.x, 1.2, p.z),
        name: k.label,
      });
    }
    return stops;
  }, []);

  // Entering a mode initializes its camera state from wherever the
  // camera currently is, so switching modes never "teleports" jarringly.
  useEffect(() => {
    const s = state.current;
    if (viewMode === "drone") {
      s.dronePos.copy(s.camPos);
      s.droneYaw = s.heading;
      s.droneLookYaw = s.heading;
      s.droneLookPitch = DRONE_DEFAULT_PITCH;
      s.droneAlt = THREE.MathUtils.clamp(s.camPos.y, DRONE_ALT_MIN, DRONE_ALT_MAX);
    } else if (viewMode === "pov") {
      s.povLookYaw = s.heading;
      s.povLookPitch = 0;
    } else if (viewMode === "satellite") {
      s.satPos.set(s.pos.x, 0, s.pos.z);
    } else if (viewMode === "tour") {
      s.tourIndex = 0;
      s.tourT = 0;
      onTourStop?.(tourStops[0]?.name ?? "");
    }
  }, [viewMode, onTourStop, tourStops]);

  // "Return to Base" — snap every mode-specific offset back to default
  useEffect(() => {
    const s = state.current;
    s.zoom = 1;
    s.orbitYaw = DEFAULT_ORBIT_YAW;
    s.droneAlt = 12;
    s.satAlt = SAT_DEFAULT_ALT;
    s.tourIndex = 0;
    s.tourT = 0;
    s.povFov = DEFAULT_FOV;
    s.lookOffsetYaw = 0;
    s.lookOffsetPitch = 0;
  }, [resetTick]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.repeat && (e.key === "v" || e.key === "V")) {
        setViewMode(viewModeRef.current === "pov" ? "follow" : "pov");
        return;
      }
      const dir = KEY_MAP[e.key];
      if (!dir) return;
      // any drive input interrupts a guided tour
      if (viewModeRef.current === "tour") {
        setViewMode("follow");
      }
      if (panelOpenRef.current) return;
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
  }, [setViewMode]);

  const { gl } = useThree();

  // scroll wheel: zoom (Navigate/Orbit), altitude (Drone/Satellite),
  // or field-of-view zoom (Street View)
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = state.current;
      const vm = viewModeRef.current;
      if (vm === "drone") {
        s.droneAlt = THREE.MathUtils.clamp(
          s.droneAlt - e.deltaY * DRONE_ALT_SPEED,
          DRONE_ALT_MIN,
          DRONE_ALT_MAX
        );
      } else if (vm === "satellite") {
        s.satAlt = THREE.MathUtils.clamp(
          s.satAlt - e.deltaY * SAT_ALT_SPEED,
          SAT_ALT_MIN,
          SAT_ALT_MAX
        );
      } else if (vm === "pov") {
        s.povFov = THREE.MathUtils.clamp(
          s.povFov + e.deltaY * POV_FOV_SPEED,
          POV_FOV_MIN,
          POV_FOV_MAX
        );
      } else {
        s.zoom = THREE.MathUtils.clamp(s.zoom + e.deltaY * ZOOM_SPEED, ZOOM_MIN, ZOOM_MAX);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl]);

  // left-drag: rotates the orbit position, only in Orbit mode
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (viewModeRef.current !== "orbit") return;
      dragging = true;
      lastX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      state.current.orbitYaw -= dx * ORBIT_DRAG_SPEED;
    };
    const onUp = (e: PointerEvent) => {
      if (e.button === 0) dragging = false;
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  // right-drag: free look, active in every mode except Guided Tour —
  // suppress the browser context menu on the canvas so right-click
  // drags instead of opening a menu
  useEffect(() => {
    const el = gl.domElement;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 2) return;
      if (viewModeRef.current === "tour") return;
      freeLookDragging.current = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!freeLookDragging.current) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const s = state.current;
      const vm = viewModeRef.current;
      if (vm === "pov") {
        s.povLookYaw -= dx * LOOK_SPEED;
        s.povLookPitch = THREE.MathUtils.clamp(
          s.povLookPitch - dy * LOOK_SPEED,
          -POV_PITCH_LIMIT,
          POV_PITCH_LIMIT
        );
      } else if (vm === "drone") {
        s.droneLookYaw -= dx * LOOK_SPEED;
        s.droneLookPitch = THREE.MathUtils.clamp(
          s.droneLookPitch - dy * LOOK_SPEED,
          DRONE_PITCH_LIMIT_DOWN,
          DRONE_PITCH_LIMIT_UP
        );
      } else {
        // Navigate, Orbit, Satellite share one look-offset
        s.lookOffsetYaw -= dx * LOOK_SPEED;
        s.lookOffsetPitch = THREE.MathUtils.clamp(
          s.lookOffsetPitch - dy * LOOK_SPEED,
          -CHASE_PITCH_LIMIT,
          CHASE_PITCH_LIMIT
        );
      }
    };
    const onUp = (e: PointerEvent) => {
      if (e.button === 2) freeLookDragging.current = false;
    };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("contextmenu", onContextMenu);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("contextmenu", onContextMenu);
    };
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

    // a click/tap always means "go here" — breaks a running tour
    if (moveCommand.current && viewMode === "tour") {
      setViewMode("follow");
    }

    const roverDrivable = viewMode === "follow" || viewMode === "pov" || viewMode === "orbit";
    const k = keys.current;
    const manualActive = !panelOpenRef.current && roverDrivable && (k.forward || k.reverse || k.left || k.right);

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
    } else if (roverDrivable) {
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
    } else {
      // Drone/Satellite/Tour: rover parks, but still accepts a queued
      // click target so it's waiting wherever you sent it when you
      // switch back to Navigate/Street View/Orbit.
      moveCommand.current = null;
    }

    // Drone flight — WASD flies the camera itself, rover stays put
    let droneFlying = false;
    if (viewMode === "drone") {
      if (!panelOpenRef.current) {
        if (k.left) {
          s.droneYaw += TURN_RATE * delta;
          droneFlying = true;
        }
        if (k.right) {
          s.droneYaw -= TURN_RATE * delta;
          droneFlying = true;
        }
        let flyAmt = 0;
        if (k.forward && !k.reverse) flyAmt = DRONE_SPEED * delta;
        else if (k.reverse && !k.forward) flyAmt = -DRONE_SPEED * 0.6 * delta;
        if (flyAmt !== 0) {
          droneFlying = true;
          const dir = new THREE.Vector3(Math.sin(s.droneYaw), 0, Math.cos(s.droneYaw));
          s.dronePos.x += dir.x * flyAmt;
          s.dronePos.z += dir.z * flyAmt;
        }
      }
      const bound = EXTENT + 12;
      s.dronePos.x = THREE.MathUtils.clamp(s.dronePos.x, -bound, bound);
      s.dronePos.z = THREE.MathUtils.clamp(s.dronePos.z, -bound, bound);
      s.dronePos.y = THREE.MathUtils.clamp(s.droneAlt, DRONE_ALT_MIN, DRONE_ALT_MAX);
    }

    // Satellite pan — WASD pans the locked top-down view
    let satPanning = false;
    if (viewMode === "satellite") {
      if (!panelOpenRef.current) {
        const step = SAT_PAN_SPEED * delta;
        if (k.forward) {
          s.satPos.z -= step;
          satPanning = true;
        }
        if (k.reverse) {
          s.satPos.z += step;
          satPanning = true;
        }
        if (k.left) {
          s.satPos.x -= step;
          satPanning = true;
        }
        if (k.right) {
          s.satPos.x += step;
          satPanning = true;
        }
      }
      const bound = EXTENT + 10;
      s.satPos.x = THREE.MathUtils.clamp(s.satPos.x, -bound, bound);
      s.satPos.z = THREE.MathUtils.clamp(s.satPos.z, -bound, bound);
    }

    // Guided tour — auto-advance through every landmark
    if (viewMode === "tour" && tourStops.length > 0) {
      s.tourT += delta;
      if (s.tourT > TOUR_DWELL) {
        s.tourT = 0;
        s.tourIndex = (s.tourIndex + 1) % tourStops.length;
        onTourStop?.(tourStops[s.tourIndex].name);
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

    // Navigate/Orbit/Satellite's shared look-offset only re-centers
    // while you're actively driving/flying in that mode and not
    // currently holding the free-look button — otherwise it's sticky.
    if (!freeLookDragging.current && (manualActive || satPanning)) {
      const r = Math.min(1, delta * LOOK_RECENTER_RATE);
      s.lookOffsetYaw += (0 - s.lookOffsetYaw) * r;
      s.lookOffsetPitch += (0 - s.lookOffsetPitch) * r;
    }

    // camera: building focus always wins; otherwise the active mode
    let wantPos: THREE.Vector3;
    let wantLook: THREE.Vector3;
    let lerpBase = 0.0015;

    if (focusView) {
      const dist = 11 * s.zoom;
      wantPos = focusView.door.clone().add(focusView.out.clone().multiplyScalar(dist));
      wantPos.y = THREE.MathUtils.clamp(7.5 * s.zoom, 2.5, 16);
      wantLook = focusView.center;
    } else if (viewMode === "tour" && tourStops.length > 0) {
      const stop = tourStops[s.tourIndex];
      wantPos = stop.camPos;
      wantLook = stop.look;
      lerpBase = 0.0006; // slow, cinematic glide between stops
    } else if (viewMode === "orbit") {
      const radius = ORBIT_RADIUS * s.zoom;
      const height = CAM_OFFSET.y * THREE.MathUtils.clamp(s.zoom, 0.7, 1.5);
      wantPos = new THREE.Vector3(
        s.pos.x + Math.sin(s.orbitYaw) * radius,
        height,
        s.pos.z + Math.cos(s.orbitYaw) * radius
      );
      const baseTarget = new THREE.Vector3(s.pos.x, 1, s.pos.z);
      wantLook = applyLookOffset(
        wantPos,
        baseTarget,
        s.lookOffsetYaw,
        s.lookOffsetPitch,
        CHASE_PITCH_LIMIT
      );
    } else if (viewMode === "drone") {
      if (!freeLookDragging.current && droneFlying) {
        // ease back to facing the flight heading while actively piloting
        const recenter = Math.min(1, delta * LOOK_RECENTER_RATE);
        let dh = s.droneYaw - s.droneLookYaw;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        s.droneLookYaw += dh * recenter;
        s.droneLookPitch += (DRONE_DEFAULT_PITCH - s.droneLookPitch) * recenter;
      }
      wantPos = s.dronePos.clone();
      const cosPitch = Math.cos(s.droneLookPitch);
      const lookDir = new THREE.Vector3(
        Math.sin(s.droneLookYaw) * cosPitch,
        Math.sin(s.droneLookPitch),
        Math.cos(s.droneLookYaw) * cosPitch
      );
      wantLook = wantPos.clone().addScaledVector(lookDir, 10);
      lerpBase = 0.00004; // snappy, first-person-adjacent piloting feel
    } else if (viewMode === "satellite") {
      wantPos = new THREE.Vector3(s.satPos.x, s.satAlt, s.satPos.z + 0.01);
      const baseTarget = new THREE.Vector3(s.satPos.x, 0, s.satPos.z);
      wantLook = applyLookOffset(
        wantPos,
        baseTarget,
        s.lookOffsetYaw,
        s.lookOffsetPitch,
        CHASE_PITCH_LIMIT
      );
      lerpBase = 0.0008;
    } else if (viewMode === "pov") {
      if (!freeLookDragging.current && manualActive) {
        // ease back to facing the direction of travel while actively driving
        const recenter = Math.min(1, delta * LOOK_RECENTER_RATE);
        let dh = s.heading - s.povLookYaw;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        s.povLookYaw += dh * recenter;
        s.povLookPitch += (0 - s.povLookPitch) * recenter;
      }
      wantPos = new THREE.Vector3(s.pos.x, EYE_HEIGHT, s.pos.z);
      const cosPitch = Math.cos(s.povLookPitch);
      const lookDir = new THREE.Vector3(
        Math.sin(s.povLookYaw) * cosPitch,
        Math.sin(s.povLookPitch),
        Math.cos(s.povLookYaw) * cosPitch
      );
      wantLook = wantPos.clone().addScaledVector(lookDir, 8);
      lerpBase = 0.00004; // snappier — first-person lag reads as laggy input
    } else {
      wantPos = s.pos.clone().add(CAM_OFFSET.clone().multiplyScalar(s.zoom));
      const baseTarget = new THREE.Vector3(s.pos.x, 1, s.pos.z);
      wantLook = applyLookOffset(
        wantPos,
        baseTarget,
        s.lookOffsetYaw,
        s.lookOffsetPitch,
        CHASE_PITCH_LIMIT
      );
    }

    const lerpK = 1 - Math.pow(lerpBase, delta); // framerate-independent lerp
    s.camPos.lerp(wantPos, lerpK);
    s.camLook.lerp(wantLook, lerpK);
    camera.position.copy(s.camPos);
    camera.lookAt(s.camLook);

    // Street View field-of-view zoom; every other mode holds the default
    const perspCam = camera as THREE.PerspectiveCamera;
    const targetFov = viewMode === "pov" ? s.povFov : DEFAULT_FOV;
    if (Math.abs(perspCam.fov - targetFov) > 0.01) {
      perspCam.fov += (targetFov - perspCam.fov) * Math.min(1, delta * FOV_EASE_RATE);
      perspCam.updateProjectionMatrix();
    }
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
