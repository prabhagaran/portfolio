"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/data/projects";
import { CityContext, type PanelId, type ViewMode, type Weather } from "./city-context";
import { CitySoundscape } from "./audio";
import { CityScene } from "./scene";
import { CityHud } from "./hud";

const rollWeather = (): Weather => (Math.random() < 0.55 ? "rain" : "clear");

/**
 * Electronic City root: owns UI state, provides the shared context to
 * both the 3D scene and the DOM HUD. Lighting mode persists in the URL
 * (?t=night) so shared links open in the same mode. Weather is tied to
 * day/night: always clear by day, re-rolled on each transition to night.
 */
export function CityExperience() {
  const initialNight =
    typeof window === "undefined"
      ? true
      : new URLSearchParams(window.location.search).get("t") !== "day";

  const [night, setNight] = useState(initialNight);
  const [weather, setWeather] = useState<Weather>(() =>
    initialNight ? rollWeather() : "clear"
  );
  const [audioOn, setAudioOn] = useState(false); // default off per spec
  const [viewMode, setViewMode] = useState<ViewMode>("follow");
  const [selected, setSelectedState] = useState<Project | null>(null);
  const [panel, setPanelState] = useState<PanelId>(null);
  const [perfWarn, setPerfWarn] = useState(false);

  const nightT = useRef(night ? 1 : 0);
  const rainT = useRef(0);
  const playerPos = useRef({ x: 0, z: 18 });
  const moveCommand = useRef<[number, number] | null>(null);
  const audio = useRef<CitySoundscape | null>(null);

  const toggleNight = useCallback(() => {
    const next = !night;
    setNight(next);
    setWeather(next ? rollWeather() : "clear");
    const url = new URL(window.location.href);
    url.searchParams.set("t", next ? "night" : "day");
    window.history.replaceState(null, "", url.toString());
  }, [night]);

  const toggleAudio = useCallback(() => {
    const next = !audioOn;
    setAudioOn(next);
    if (next) {
      audio.current ??= new CitySoundscape();
      audio.current.start();
    } else {
      audio.current?.stop();
      audio.current = null;
    }
  }, [audioOn]);

  const toggleViewMode = useCallback(() => {
    setViewMode((v) => (v === "follow" ? "pov" : "follow"));
  }, []);

  // keep the rain sound layer in step with the visual weather
  useEffect(() => {
    if (audioOn) audio.current?.setRain(weather === "rain");
  }, [audioOn, weather]);

  // silence everything when leaving the city
  useEffect(() => {
    return () => {
      audio.current?.stop();
      audio.current = null;
    };
  }, []);

  // Opening a project closes any kiosk panel and vice versa.
  const setSelected = useCallback((p: Project | null) => {
    setSelectedState(p);
    if (p) setPanelState(null);
  }, []);
  const setPanel = useCallback((p: PanelId) => {
    setPanelState(p);
    if (p) setSelectedState(null);
  }, []);

  const ctx = useMemo(
    () => ({
      night,
      toggleNight,
      weather,
      audioOn,
      toggleAudio,
      viewMode,
      toggleViewMode,
      selected,
      setSelected,
      panel,
      setPanel,
      nightT,
      rainT,
      playerPos,
      moveCommand,
    }),
    [
      night,
      toggleNight,
      weather,
      audioOn,
      toggleAudio,
      viewMode,
      toggleViewMode,
      selected,
      setSelected,
      panel,
      setPanel,
    ]
  );

  return (
    <CityContext.Provider value={ctx}>
      <div className="fixed inset-0 bg-background">
        <CityScene onLowFps={() => setPerfWarn(true)} />
        <CityHud perfWarn={perfWarn} onDismissPerf={() => setPerfWarn(false)} />
      </div>
    </CityContext.Provider>
  );
}
