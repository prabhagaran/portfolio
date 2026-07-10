export type LightPhase = "green" | "yellow" | "red";

export interface SignalState {
  main: LightPhase; // main street (E-W) lanes
  cross: LightPhase; // cross street (N-S) lanes
}

const GREEN_T = 6;
const YELLOW_T = 1.5;
const ALL_RED_T = 0.6; // brief clearance gap between phases
const HALF_CYCLE = GREEN_T + YELLOW_T + ALL_RED_T;
const CYCLE = HALF_CYCLE * 2;

/**
 * Deterministic traffic-light phase, purely a function of the shared
 * R3F clock (`state.clock.elapsedTime`). Every consumer — signal
 * poles, vehicle braking — derives the same phase independently with
 * no shared React state or ref to keep in sync.
 */
export function getSignalState(elapsed: number): SignalState {
  const t = elapsed % CYCLE;
  if (t < GREEN_T) return { main: "green", cross: "red" };
  if (t < GREEN_T + YELLOW_T) return { main: "yellow", cross: "red" };
  if (t < HALF_CYCLE) return { main: "red", cross: "red" };
  const t2 = t - HALF_CYCLE;
  if (t2 < GREEN_T) return { main: "red", cross: "green" };
  if (t2 < GREEN_T + YELLOW_T) return { main: "red", cross: "yellow" };
  return { main: "red", cross: "red" };
}
