"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { F1Context, type InputState, type PitId } from "./f1-context";
import { F1Scene } from "./f1-scene";
import { F1Hud } from "./hud";
import { spawn } from "./track-data";

/**
 * F1 Track root: owns UI state and provides the shared context to the
 * 3D scene and the DOM HUD — same split as the Electronic City root.
 * Purely additive next to Classic and City (spec §4.7): nothing here
 * touches either of the other modes.
 */
export function F1Experience() {
  const [panel, setPanel] = useState<PitId>(null);
  const [resetTick, setResetTick] = useState(0);
  const [perfWarn, setPerfWarn] = useState(false);

  const input = useRef<InputState>({
    left: false,
    right: false,
    throttle: false,
    brake: false,
  });
  const carPos = useRef({ x: spawn.x, z: spawn.z, heading: spawn.heading });
  const speedKmh = useRef(0);

  const resetCar = useCallback(() => {
    setPanel(null);
    setResetTick((t) => t + 1);
  }, []);

  const ctx = useMemo(
    () => ({ panel, setPanel, resetTick, resetCar, input, carPos, speedKmh }),
    [panel, resetTick, resetCar]
  );

  return (
    <F1Context.Provider value={ctx}>
      <div className="fixed inset-0 bg-background">
        <F1Scene onLowFps={() => setPerfWarn(true)} />
        <F1Hud perfWarn={perfWarn} onDismissPerf={() => setPerfWarn(false)} />
      </div>
    </F1Context.Provider>
  );
}
