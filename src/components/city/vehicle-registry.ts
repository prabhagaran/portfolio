import * as THREE from "three";

/**
 * Lightweight shared registry of live vehicle positions. Traffic
 * writes into it every frame (mutating pre-allocated slots, no
 * per-frame allocation); Pedestrians reads it to yield when crossing
 * a vehicle lane, rather than the two systems only avoiding their own
 * kind. A module-level singleton is fine here — there is only ever
 * one Traffic instance mounted per city session.
 */
export interface ObstacleSlot {
  position: THREE.Vector3;
  radius: number;
}

export function createObstacleRegistry(count: number): ObstacleSlot[] {
  return Array.from({ length: count }, () => ({
    position: new THREE.Vector3(9999, 0, 9999),
    radius: 0.9,
  }));
}
