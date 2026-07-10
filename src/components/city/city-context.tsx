"use client";

import { createContext, useContext, type MutableRefObject } from "react";
import type { Project } from "@/data/projects";

export type PanelId = "about" | "contact" | "resume" | "nila" | "park" | null;

export type Weather = "clear" | "rain";

export interface CityState {
  /** UI state */
  night: boolean;
  toggleNight: () => void;
  weather: Weather; // re-rolled on each transition to night; clear by day
  audioOn: boolean;
  toggleAudio: () => void;
  selected: Project | null;
  setSelected: (p: Project | null) => void;
  panel: PanelId;
  setPanel: (p: PanelId) => void;

  /** Mutable per-frame state (never triggers React renders) */
  nightT: MutableRefObject<number>; // lerped 0 (day) → 1 (night)
  rainT: MutableRefObject<number>; // lerped 0 (clear) → 1 (raining)
  playerPos: MutableRefObject<{ x: number; z: number }>;
  moveCommand: MutableRefObject<[number, number] | null>; // consumed by Player
}

export const CityContext = createContext<CityState | null>(null);

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used inside CityContext");
  return ctx;
}
