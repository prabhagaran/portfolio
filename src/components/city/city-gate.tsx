"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { setStoredMode } from "@/lib/mode";

// The 3D bundle (three.js + scene) only starts downloading AFTER the
// capability check passes — a failing device never pays for it.
const CityExperience = dynamic(
  () => import("./city-experience").then((m) => m.CityExperience),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        Powering up Electronic City…
      </p>
    </div>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/** Rough device-tier heuristic: flag clearly low-power hardware only. */
function isLowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  return cores <= 2 || memory <= 2;
}

export function CityGate() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supportsWebGL() || isLowPowerDevice()) {
      setStoredMode("classic");
      router.replace("/?mode=classic&reason=webgl");
      return;
    }
    setReady(true);
  }, [router]);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Escape hatch: present immediately, before/while anything loads */}
      <Link
        href="/?mode=classic"
        onClick={() => setStoredMode("classic")}
        className="fixed left-4 top-4 z-50 inline-flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface/90 px-4 text-sm text-slate-200 shadow-card backdrop-blur-sm transition-colors duration-200 hover:border-accent/60 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Skip to classic portfolio
      </Link>
      {ready ? <CityExperience /> : <LoadingScreen />}
    </div>
  );
}
