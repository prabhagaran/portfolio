"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BookText,
  Boxes,
  Download,
  Mail,
  MapPin,
  RotateCcw,
  X,
} from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa6";
import { Badge } from "@/components/ui/badge";
import { setStoredMode } from "@/lib/mode";
import { site, stats } from "@/data/site";
import { projects, type ProjectStatus } from "@/data/projects";
import { fetchContributions, type ContribData } from "../city/github-data";
import { useF1, type PitId } from "./f1-context";
import { START_U, pits, pitWorlds, samples, trackCurve } from "./track-data";

const statusTone: Record<ProjectStatus, "blue" | "emerald" | "amber" | "neutral"> = {
  Production: "emerald",
  Active: "blue",
  Prototype: "amber",
  "Open Source": "neutral",
};

/* ---------------- speedometer ---------------- */

function Speedo() {
  const { speedKmh } = useF1();
  const num = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (num.current) num.current.textContent = String(Math.round(speedKmh.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speedKmh]);

  return (
    <div className="pointer-events-none flex items-baseline gap-2 rounded-card border border-line bg-surface/85 px-4 py-2.5 shadow-card backdrop-blur-sm">
      <span ref={num} className="min-w-[3ch] text-right font-mono text-3xl font-bold tabular-nums text-slate-50">
        0
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-faint">km/h</span>
    </div>
  );
}

/* ---------------- minimap ---------------- */

function Minimap() {
  const { carPos } = useF1();
  const dot = useRef<SVGCircleElement>(null);

  const trackPath = useMemo(() => {
    const pts = samples.filter((_, i) => i % 8 === 0);
    return (
      pts.map((s, i) => `${i === 0 ? "M" : "L"}${s.x.toFixed(1)},${s.z.toFixed(1)}`).join(" ") + " Z"
    );
  }, []);

  const start = useMemo(() => trackCurve.getPointAt(START_U), []);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (dot.current) {
        dot.current.setAttribute("cx", carPos.current.x.toFixed(1));
        dot.current.setAttribute("cy", carPos.current.z.toFixed(1));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [carPos]);

  return (
    <div
      className="pointer-events-none relative hidden overflow-hidden rounded-card border border-line bg-surface/85 p-2 shadow-card backdrop-blur-sm sm:block"
      role="img"
      aria-label="Track minimap with car position and pit stops"
    >
      <svg width={196} height={116} viewBox="-116 -68 232 138">
        <path d={trackPath} fill="none" stroke="#1d2735" strokeWidth={11} strokeLinejoin="round" />
        <path d={trackPath} fill="none" stroke="#3a4557" strokeWidth={1.5} strokeDasharray="4 4" />
        {/* start line */}
        <circle cx={start.x} cy={start.z} r={3} fill="#f1f5f9" />
        {/* pit stops */}
        {pitWorlds.map((p) => (
          <circle key={p.def.id} cx={p.triggerX} cy={p.triggerZ} r={4} fill={p.def.accent} />
        ))}
        {/* car */}
        <circle ref={dot} cx={start.x} cy={start.z} r={3.5} fill="#ffffff" stroke="#3b82f6" strokeWidth={2} />
      </svg>
      <span className="absolute bottom-1.5 left-2.5 font-mono text-[9px] text-faint">
        PORTFOLIO GP
      </span>
    </div>
  );
}

/* ---------------- touch controls (mobile is a firm requirement) ---------------- */

function useTouchButton(key: "left" | "right" | "throttle" | "brake") {
  const { input } = useF1();
  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      input.current[key] = true;
    },
    onPointerUp: () => {
      input.current[key] = false;
    },
    onPointerCancel: () => {
      input.current[key] = false;
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

const touchBtn =
  "pointer-events-auto flex h-16 w-16 select-none items-center justify-center rounded-full border border-line bg-surface/80 text-2xl text-slate-100 shadow-card backdrop-blur-sm active:border-accent active:bg-accent-soft";

function TouchControls() {
  const left = useTouchButton("left");
  const right = useTouchButton("right");
  const gas = useTouchButton("throttle");
  const brake = useTouchButton("brake");

  return (
    <div className="absolute inset-x-0 bottom-6 z-30 flex items-end justify-between px-6 [touch-action:none]">
      <div className="flex gap-3">
        <button type="button" aria-label="Steer left" className={touchBtn} {...left}>
          ◀
        </button>
        <button type="button" aria-label="Steer right" className={touchBtn} {...right}>
          ▶
        </button>
      </div>
      <div className="flex gap-3">
        <button type="button" aria-label="Brake / reverse" className={touchBtn} {...brake}>
          ▼
        </button>
        <button
          type="button"
          aria-label="Accelerate"
          className={`${touchBtn} h-20 w-20 border-emerald/50 text-emerald-300`}
          {...gas}
        >
          ▲
        </button>
      </div>
    </div>
  );
}

/* ---------------- pit-stop panels ---------------- */

function Panel({
  pit,
  onClose,
  children,
}: {
  pit: Exclude<PitId, null>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const def = pits.find((p) => p.id === pit)!;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 48 }}
      transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="pointer-events-auto fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col overflow-y-auto border-l border-line bg-surface/95 p-6 shadow-card-hover backdrop-blur-md sm:my-4 sm:mr-4 sm:rounded-card sm:border sm:[inset-block:auto] sm:max-h-[calc(100vh-2rem)]"
      role="dialog"
      aria-label={def.label}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.2em]"
            style={{ color: def.accent }}
          >
            Pit stop
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-50">{def.label}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel and return to the track"
          className="rounded-md p-1.5 text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4">{children}</div>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 inline-flex items-center gap-2 border-t border-line pt-5 text-sm text-muted transition-colors duration-200 hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to the track
      </button>
    </motion.aside>
  );
}

function AboutPanel({ onClose }: { onClose: () => void }) {
  return (
    <Panel pit="about" onClose={onClose}>
      <p className="text-sm leading-relaxed text-muted">{site.tagline}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card border border-line bg-surface-2 p-3 text-center">
            <p className="text-xl font-semibold text-slate-50">
              {s.value}
              {s.suffix}
            </p>
            <p className="mt-0.5 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>
      <Link
        href="/?mode=classic#about"
        onClick={() => setStoredMode("classic")}
        className="mt-6 inline-flex items-center gap-2 text-sm text-accent transition-colors duration-200 hover:text-blue-300"
      >
        Full story in the classic portfolio
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Panel>
  );
}

function ContactPanel({ onClose }: { onClose: () => void }) {
  return (
    <Panel pit="contact" onClose={onClose}>
      <div className="space-y-3">
        <a
          href={`mailto:${site.email}`}
          className="flex items-center gap-3 rounded-card border border-line bg-surface-2 p-3 text-sm text-slate-200 transition-colors duration-200 hover:border-line-strong"
        >
          <Mail className="h-4 w-4 text-accent" aria-hidden="true" /> {site.email}
        </a>
        <a
          href={site.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-card border border-line bg-surface-2 p-3 text-sm text-slate-200 transition-colors duration-200 hover:border-line-strong"
        >
          <FaGithub className="h-4 w-4 text-accent" aria-hidden="true" /> @{site.github}
        </a>
        <a
          href={site.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-card border border-line bg-surface-2 p-3 text-sm text-slate-200 transition-colors duration-200 hover:border-line-strong"
        >
          <FaLinkedin className="h-4 w-4 text-accent" aria-hidden="true" /> LinkedIn
        </a>
        <p className="flex items-center gap-3 rounded-card border border-line bg-surface-2 p-3 text-sm text-slate-200">
          <MapPin className="h-4 w-4 text-emerald" aria-hidden="true" /> {site.location}
        </p>
        <a
          href={site.resumeUrl}
          download
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-[10px] bg-accent px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-500"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Download Resume (PDF)
        </a>
      </div>
    </Panel>
  );
}

function ProjectsPanel({ onClose }: { onClose: () => void }) {
  return (
    <Panel pit="projects" onClose={onClose}>
      <p className="text-sm leading-relaxed text-muted">
        The full garage — every project, same data as the classic portfolio.
      </p>
      <div className="mt-4 space-y-3">
        {projects.map((p) => (
          <div key={p.slug} className="rounded-card border border-line bg-surface-2 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-100">{p.name}</p>
              <Badge tone={statusTone[p.status]}>{p.status}</Badge>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{p.description}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {p.github && (
                <a
                  href={p.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-slate-200 transition-colors duration-200 hover:border-line-strong"
                >
                  <FaGithub className="h-3 w-3" aria-hidden="true" /> GitHub
                </a>
              )}
              {p.demo && (
                <a
                  href={p.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 font-mono text-[10px] text-blue-300 transition-colors duration-200 hover:border-accent/70"
                >
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" /> Demo
                </a>
              )}
              {p.docs && (
                <Link
                  href={p.docs}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-slate-200 transition-colors duration-200 hover:border-line-strong"
                >
                  <BookText className="h-3 w-3" aria-hidden="true" /> Docs
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function GithubPanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<ContribData | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchContributions(site.github).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Panel pit="github" onClose={onClose}>
      <p className="text-sm leading-relaxed text-muted">
        Live telemetry from the repo garage — real contribution data from my
        GitHub profile.
      </p>
      {data ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-card border border-line bg-surface-2 p-3 text-center">
            <p className="text-xl font-semibold text-slate-50">{data.total.toLocaleString()}</p>
            <p className="mt-0.5 text-xs text-muted">Contributions / year</p>
          </div>
          <div className="rounded-card border border-line bg-surface-2 p-3 text-center">
            <p className="text-xl font-semibold text-slate-50">{data.days.length}</p>
            <p className="mt-0.5 text-xs text-muted">Days tracked</p>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-xs text-faint">Loading live contribution data…</p>
      )}
      <a
        href={site.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-[10px] border border-line px-4 text-sm text-slate-200 transition-colors duration-200 hover:border-accent/60 hover:text-white"
      >
        <FaGithub className="h-4 w-4" aria-hidden="true" />
        View full profile
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </Panel>
  );
}

function PitPanels() {
  const { panel, setPanel } = useF1();
  const close = () => setPanel(null);
  return (
    <AnimatePresence>
      {panel === "about" && <AboutPanel key="about" onClose={close} />}
      {panel === "contact" && <ContactPanel key="contact" onClose={close} />}
      {panel === "projects" && <ProjectsPanel key="projects" onClose={close} />}
      {panel === "github" && <GithubPanel key="github" onClose={close} />}
    </AnimatePresence>
  );
}

/* ---------------- performance prompt ---------------- */

function PerfPrompt({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  if (!show) return null;
  return (
    <div
      role="alertdialog"
      aria-label="Performance suggestion"
      className="pointer-events-auto fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit max-w-[92vw] flex-wrap items-center gap-3 rounded-card border border-line bg-surface/95 px-4 py-3 text-sm text-slate-200 shadow-card-hover backdrop-blur-md"
    >
      <span>This device is struggling with 3D — the classic view will be much smoother.</span>
      <Link
        href="/?mode=classic&reason=perf"
        onClick={() => setStoredMode("classic")}
        className="rounded-[8px] bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-blue-500"
      >
        Switch to classic
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-muted transition-colors duration-200 hover:text-slate-100"
      >
        Keep driving
      </button>
    </div>
  );
}

/* ---------------- HUD root ---------------- */

export function F1Hud({
  perfWarn,
  onDismissPerf,
}: {
  perfWarn: boolean;
  onDismissPerf: () => void;
}) {
  const { resetCar } = useF1();
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* top bar — skip link lives in the gate (visible within 1s); here: mode switch + reset */}
      <div className="flex items-start justify-end gap-2 p-4">
        <Link
          href="/city"
          onClick={() => setStoredMode("city")}
          className="pointer-events-auto inline-flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface/90 px-3 text-sm text-slate-200 shadow-card backdrop-blur-sm transition-colors duration-200 hover:border-emerald/60"
        >
          <Boxes className="h-4 w-4 text-emerald-300" aria-hidden="true" />
          <span className="hidden sm:inline">Electronic City</span>
        </Link>
        <button
          type="button"
          onClick={resetCar}
          title="Back to grid (R recovers to the nearest track edge)"
          className="pointer-events-auto inline-flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface/90 px-3 text-sm text-slate-200 shadow-card backdrop-blur-sm transition-colors duration-200 hover:border-accent/60"
        >
          <RotateCcw className="h-4 w-4 text-amber-300" aria-hidden="true" />
          <span className="hidden sm:inline">Back to grid</span>
        </button>
      </div>

      {/* bottom-left: speed + hints / bottom-right: minimap.
          With touch controls active, the speedo moves up out of thumb reach. */}
      <div className={touch ? "absolute bottom-32 left-4 space-y-2" : "absolute bottom-4 left-4 space-y-2"}>
        <Speedo />
        <div className="hidden max-w-[280px] space-y-1 rounded-card border border-line bg-surface/85 px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-muted shadow-card backdrop-blur-sm sm:block">
          <p>W/↑ throttle · S/↓ brake &amp; reverse · A D/←→ steer</p>
          <p>Drive into a glowing pit ring to open that section</p>
          <p>R recovers to the track · kerbs are fine, grass is slow</p>
        </div>
      </div>
      <div className="absolute bottom-4 right-4">
        <Minimap />
      </div>

      {touch && <TouchControls />}

      <PitPanels />
      <PerfPrompt show={perfWarn} onDismiss={onDismissPerf} />
    </div>
  );
}
