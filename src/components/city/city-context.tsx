"use client";

import { createContext, useContext, type MutableRefObject } from "react";
import type { Project } from "@/data/projects";
import type { ContribData } from "./github-data";

export type PanelId =
  | "about"
  | "contact"
  | "resume"
  | "skills"
  | "nila"
  | "park"
  | "github"
  | "directory"
  | null;

export type Weather = "clear" | "rain";

/**
 * Camera / navigation modes:
 * - follow:    Navigate — third-person chase camera, drives the rover
 * - pov:       Street View — first-person from the rover
 * - orbit:     Orbit — camera circles the (still-drivable) rover, drag to spin
 * - drone:     Drone View — free-fly camera, decoupled from the rover
 * - satellite: Satellite View — locked top-down overview, pannable
 * - tour:      Guided Tour — automated flythrough of every landmark
 */
export type ViewMode = "follow" | "pov" | "orbit" | "drone" | "satellite" | "tour";

export interface CityState {
  /** UI state */
  night: boolean;
  toggleNight: () => void;
  weather: Weather; // re-rolled on each transition to night; clear by day
  audioOn: boolean;
  toggleAudio: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  /** Bumps on every "Return to Base" — Player watches this to reset zoom/orbit/drone state */
  resetTick: number;
  resetCamera: () => void;
  selected: Project | null;
  setSelected: (p: Project | null) => void;
  panel: PanelId;
  setPanel: (p: PanelId) => void;
  /** Name of the current Guided Tour stop; null when not touring */
  tourStopName: string | null;
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
