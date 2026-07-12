"use client";

import { createContext, useContext, type MutableRefObject } from "react";

/** The four pit-stop portfolio sections, or null when driving. */
export type PitId = "about" | "contact" | "projects" | "github" | null;

/** Merged driver input — keyboard and touch both write here. */
export interface InputState {
  left: boolean;
  right: boolean;
  throttle: boolean;
  brake: boolean;
}

export interface F1State {
  /** open pit-stop panel; the car holds still while one is open */
  panel: PitId;
  setPanel: (p: PitId) => void;
  /** bumps on "Back to grid" — Car watches this to respawn */
  resetTick: number;
  resetCar: () => void;

  /** Mutable per-frame state (never triggers React renders) */
  input: MutableRefObject<InputState>;
  carPos: MutableRefObject<{ x: number; z: number; heading: number }>;
  speedKmh: MutableRefObject<number>;
}

export const F1Context = createContext<F1State | null>(null);

export function useF1() {
  const ctx = useContext(F1Context);
  if (!ctx) throw new Error("useF1 must be used inside F1Context");
  return ctx;
}
