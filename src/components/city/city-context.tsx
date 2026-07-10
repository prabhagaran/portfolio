"use client";

import { createContext, useContext, type MutableRefObject } from "react";
import type { Project } from "@/data/projects";
import type { ContribData } from "./github-data";

export type PanelId = "about" | "contact" | "resume" | "nila" | "park" | "github" | null;

export type Weather = "clear" | "rain";

/** "follow": third-person chase camera. "pov": first-person from the rover. */
export type ViewMode = "follow" | "pov";

export interface CityState {
  /** UI state */
  night: boolean;
  toggleNight: () => void;
  weather: Weather; // re-rolled on each transition to night; clear by day
  audioOn: boolean;
  toggleAudio: () => void;
  viewMode: ViewMode;
  toggleViewMode: () => void;
  selected: Project | null;
  setSelected: (p: Project | null) => void;
  panel: PanelId;
  setPanel: (p: PanelId) => void;
  /** Real contribution history for the GitHub data tower; null while loading/unavailable */
  githubData: ContribData | null;

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
